import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

interface Column {
  id: string
  header: string
  width: number
  align: 'left' | 'right'
  sortable: boolean
}

interface Row {
  [key: string]: string | number
}

interface SortEntry {
  colId: string
  dir: 'asc' | 'desc'
}

interface State {
  cursorRow: number
  cursorCol: number
  sorts: SortEntry[]
  filter: string
  filterMode: boolean
  selected: Set<number>
  scroll: number
  colWidths: number[]
}

type Action =
  | { type: 'up' }
  | { type: 'down'; max: number }
  | { type: 'left' }
  | { type: 'right'; max: number }
  | { type: 'page_up' }
  | { type: 'page_down'; max: number }
  | { type: 'top' }
  | { type: 'bottom'; max: number }
  | { type: 'sort'; colId: string }
  | { type: 'multi_sort'; colId: string }
  | { type: 'toggle_select' }
  | { type: 'select_all'; max: number }
  | { type: 'clear_select' }
  | { type: 'start_filter' }
  | { type: 'end_filter' }
  | { type: 'clear_filter' }
  | { type: 'filter_type'; ch: string }
  | { type: 'filter_del' }
  | { type: 'widen_col' }
  | { type: 'narrow_col' }

/* ── Column definitions ── */

const COLUMNS: Column[] = [
  { id: 'name',   header: 'Name',   width: 16, align: 'left',  sortable: true },
  { id: 'status', header: 'Status', width: 9,  align: 'left',  sortable: true },
  { id: 'cpu',    header: 'CPU%',   width: 7,  align: 'right', sortable: true },
  { id: 'memory', header: 'Mem MB', width: 8,  align: 'right', sortable: true },
  { id: 'uptime', header: 'Uptime', width: 10, align: 'left',  sortable: true },
  { id: 'region', header: 'Region', width: 10, align: 'left',  sortable: true },
]

const VIEWPORT = 15
const SEL_W = 3

/* ── Demo data ── */

const ROWS: Row[] = [
  { name: 'api-gateway',   status: 'running', cpu: 12.4, memory: 256,  uptime: '14d 3h',  region: 'us-east-1' },
  { name: 'auth-service',  status: 'running', cpu: 8.2,  memory: 128,  uptime: '14d 3h',  region: 'us-east-1' },
  { name: 'worker-01',     status: 'running', cpu: 67.8, memory: 512,  uptime: '7d 12h',  region: 'us-west-2' },
  { name: 'worker-02',     status: 'running', cpu: 43.1, memory: 384,  uptime: '7d 12h',  region: 'us-west-2' },
  { name: 'cache-redis',   status: 'running', cpu: 3.5,  memory: 1200, uptime: '30d 1h',  region: 'us-east-1' },
  { name: 'db-primary',    status: 'running', cpu: 22.7, memory: 2100, uptime: '30d 1h',  region: 'us-east-1' },
  { name: 'db-replica',    status: 'stopped', cpu: 0.0,  memory: 0,    uptime: '-',        region: 'us-east-1' },
  { name: 'queue-rabbit',  status: 'running', cpu: 5.3,  memory: 340,  uptime: '21d 8h',  region: 'eu-west-1' },
  { name: 'ml-inference',  status: 'running', cpu: 89.2, memory: 4200, uptime: '2d 6h',   region: 'us-west-2' },
  { name: 'scheduler',     status: 'pending', cpu: 0.0,  memory: 0,    uptime: '-',        region: 'us-east-1' },
  { name: 'monitoring',    status: 'running', cpu: 6.1,  memory: 192,  uptime: '14d 3h',  region: 'eu-west-1' },
  { name: 'cdn-proxy',     status: 'running', cpu: 15.9, memory: 96,   uptime: '60d 2h',  region: 'ap-south-1' },
  { name: 'log-collector', status: 'running', cpu: 11.3, memory: 280,  uptime: '14d 3h',  region: 'us-east-1' },
  { name: 'email-service', status: 'stopped', cpu: 0.0,  memory: 0,    uptime: '-',        region: 'eu-west-1' },
  { name: 'cron-jobs',     status: 'running', cpu: 1.8,  memory: 64,   uptime: '45d 0h',  region: 'us-east-1' },
  { name: 'search-engine', status: 'running', cpu: 34.5, memory: 1800, uptime: '10d 4h',  region: 'us-west-2' },
  { name: 'file-storage',  status: 'running', cpu: 7.9,  memory: 220,  uptime: '30d 1h',  region: 'ap-south-1' },
  { name: 'notification',  status: 'pending', cpu: 0.0,  memory: 0,    uptime: '-',        region: 'us-east-1' },
  { name: 'analytics',     status: 'running', cpu: 28.3, memory: 960,  uptime: '5d 11h',  region: 'eu-west-1' },
  { name: 'billing-svc',   status: 'running', cpu: 4.6,  memory: 148,  uptime: '14d 3h',  region: 'us-east-1' },
]

/* ── Helpers ── */

function pad(s: string, w: number, align: 'left' | 'right'): string {
  const t = s.length > w ? s.slice(0, w) : s
  const gap = w - t.length
  return align === 'right' ? ' '.repeat(gap) + t : t + ' '.repeat(gap)
}

function statusColor(v: string, c: ReturnType<typeof useTheme>): string | undefined {
  if (v === 'running') return c.success
  if (v === 'stopped') return c.error
  if (v === 'pending') return c.warning
  return undefined
}

function isNumCol(id: string): boolean {
  return id === 'cpu' || id === 'memory'
}

/* ── Reducer ── */

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'up':
      return { ...state, cursorRow: Math.max(0, state.cursorRow - 1) }
    case 'down':
      return { ...state, cursorRow: Math.min(action.max - 1, state.cursorRow + 1) }
    case 'left':
      return { ...state, cursorCol: Math.max(0, state.cursorCol - 1) }
    case 'right':
      return { ...state, cursorCol: Math.min(action.max - 1, state.cursorCol + 1) }
    case 'page_up':
      return { ...state, cursorRow: Math.max(0, state.cursorRow - 10) }
    case 'page_down':
      return { ...state, cursorRow: Math.min(action.max - 1, state.cursorRow + 10) }
    case 'top':
      return { ...state, cursorRow: 0 }
    case 'bottom':
      return { ...state, cursorRow: Math.max(0, action.max - 1) }
    case 'sort': {
      const cur = state.sorts.find(s => s.colId === action.colId)
      let next: SortEntry[]
      if (!cur) next = [{ colId: action.colId, dir: 'asc' }]
      else if (cur.dir === 'asc') next = [{ colId: action.colId, dir: 'desc' }]
      else next = []
      return { ...state, sorts: next, cursorRow: 0 }
    }
    case 'multi_sort': {
      const cur = state.sorts.find(s => s.colId === action.colId)
      if (!cur) return { ...state, sorts: [...state.sorts, { colId: action.colId, dir: 'asc' }], cursorRow: 0 }
      if (cur.dir === 'asc') return { ...state, sorts: state.sorts.map(s => s.colId === action.colId ? { ...s, dir: 'desc' as const } : s), cursorRow: 0 }
      return { ...state, sorts: state.sorts.filter(s => s.colId !== action.colId), cursorRow: 0 }
    }
    case 'toggle_select': {
      const next = new Set(state.selected)
      if (next.has(state.cursorRow)) next.delete(state.cursorRow)
      else next.add(state.cursorRow)
      return { ...state, selected: next }
    }
    case 'select_all': {
      const all = new Set<number>()
      for (let i = 0; i < action.max; i++) all.add(i)
      return { ...state, selected: all }
    }
    case 'clear_select':
      return { ...state, selected: new Set() }
    case 'start_filter':
      return { ...state, filterMode: true, filter: '', cursorRow: 0 }
    case 'end_filter':
      return { ...state, filterMode: false }
    case 'clear_filter':
      return { ...state, filterMode: false, filter: '', cursorRow: 0 }
    case 'filter_type':
      return { ...state, filter: state.filter + action.ch, cursorRow: 0 }
    case 'filter_del':
      return { ...state, filter: state.filter.slice(0, -1), cursorRow: 0 }
    case 'widen_col': {
      const w = [...state.colWidths]
      w[state.cursorCol] = Math.min(30, (w[state.cursorCol] ?? 10) + 2)
      return { ...state, colWidths: w }
    }
    case 'narrow_col': {
      const w = [...state.colWidths]
      w[state.cursorCol] = Math.max(4, (w[state.cursorCol] ?? 10) - 2)
      return { ...state, colWidths: w }
    }
  }
}

/* ── Component ── */

export function DataTable() {
  const colors = useTheme()

  const [state, dispatch] = useReducer(reducer, {
    cursorRow: 0,
    cursorCol: 0,
    sorts: [],
    filter: '',
    filterMode: false,
    selected: new Set<number>(),
    scroll: 0,
    colWidths: COLUMNS.map(c => c.width),
  })

  const { cursorRow, cursorCol, sorts, filter, filterMode, selected, colWidths } = state

  // Filter
  let filtered = ROWS
  if (filter) {
    const q = filter.toLowerCase()
    filtered = ROWS.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)))
  }

  // Sort
  const sorted = [...filtered]
  if (sorts.length > 0) {
    sorted.sort((a, b) => {
      for (const s of sorts) {
        const col = COLUMNS.find(c => c.id === s.colId)
        if (!col) continue
        let cmp = isNumCol(col.id)
          ? (Number(a[col.id]) || 0) - (Number(b[col.id]) || 0)
          : String(a[col.id]).localeCompare(String(b[col.id]))
        if (s.dir === 'desc') cmp = -cmp
        if (cmp !== 0) return cmp
      }
      return 0
    })
  }

  const total = sorted.length

  // Scroll
  let scrollOff = state.scroll
  if (cursorRow < scrollOff) scrollOff = cursorRow
  if (cursorRow >= scrollOff + VIEWPORT) scrollOff = cursorRow - VIEWPORT + 1
  scrollOff = Math.max(0, Math.min(scrollOff, Math.max(0, total - VIEWPORT)))
  const visible = sorted.slice(scrollOff, scrollOff + VIEWPORT)

  // Scrollbar
  const showScroll = total > VIEWPORT
  const maxScroll = Math.max(1, total - VIEWPORT)
  let thumbSize = VIEWPORT, thumbStart = 0
  if (showScroll) {
    thumbSize = Math.max(1, Math.round((VIEWPORT / total) * VIEWPORT))
    thumbStart = Math.round((scrollOff / maxScroll) * (VIEWPORT - thumbSize))
  }

  // Sort indicator
  function sortInd(colId: string): string {
    const e = sorts.find(s => s.colId === colId)
    if (!e) return '\u00B7'
    return e.dir === 'asc' ? '\u25B2' : '\u25BC'
  }

  function sortDesc(): string {
    return sorts.map(s => {
      const col = COLUMNS.find(c => c.id === s.colId)
      return `${col?.header ?? s.colId} ${s.dir === 'asc' ? '\u25B2' : '\u25BC'}`
    }).join(', ')
  }

  // Input
  useInput((ch, key) => {
    if (filterMode) {
      if (key.escape) dispatch({ type: 'end_filter' })
      else if (key.ctrl && ch === 'x') dispatch({ type: 'clear_filter' })
      else if (key.backspace || key.delete) dispatch({ type: 'filter_del' })
      else if (ch && !key.ctrl && !key.meta) dispatch({ type: 'filter_type', ch })
      return
    }

    if (key.upArrow || ch === 'k') dispatch({ type: 'up' })
    else if (key.downArrow || ch === 'j') dispatch({ type: 'down', max: total })
    else if (key.leftArrow || ch === 'h') dispatch({ type: 'left' })
    else if (key.rightArrow || ch === 'l') dispatch({ type: 'right', max: COLUMNS.length })
    else if (key.pageUp) dispatch({ type: 'page_up' })
    else if (key.pageDown) dispatch({ type: 'page_down', max: total })
    else if (ch === 'g') dispatch({ type: 'top' })
    else if (ch === 'G') dispatch({ type: 'bottom', max: total })
    else if (ch === 's') {
      const col = COLUMNS[cursorCol]
      if (col?.sortable) dispatch({ type: 'sort', colId: col.id })
    }
    else if (ch === 'S') {
      const col = COLUMNS[cursorCol]
      if (col?.sortable) dispatch({ type: 'multi_sort', colId: col.id })
    }
    else if (ch === ' ') dispatch({ type: 'toggle_select' })
    else if (ch === 'a') dispatch({ type: 'select_all', max: total })
    else if (ch === 'x') dispatch({ type: 'clear_select' })
    else if (ch === '/') dispatch({ type: 'start_filter' })
    else if (ch === '+') dispatch({ type: 'widen_col' })
    else if (ch === '-') dispatch({ type: 'narrow_col' })
  })

  return (
    <Box flexDirection="column" paddingX={1} overflow="hidden">
      {/* Title */}
      <Box marginBottom={0} gap={2}>
        <Text bold color={colors.primary}>DataTable</Text>
        {selected.size > 0 && <Text color={colors.success}>{selected.size} selected</Text>}
      </Box>

      {/* Filter */}
      {filterMode && (
        <Box>
          <Text color={colors.warning}>/ </Text>
          <Text>{filter}</Text>
          <Text color="gray">_</Text>
          <Text dimColor>  {filtered.length}/{ROWS.length} rows</Text>
        </Box>
      )}
      {!filterMode && filter && (
        <Box>
          <Text dimColor>filter: </Text>
          <Text color={colors.warning}>{filter}</Text>
          <Text dimColor>  {filtered.length}/{ROWS.length} rows</Text>
        </Box>
      )}

      {/* Header */}
      <Box>
        <Box width={SEL_W}><Text dimColor> </Text></Box>
        {COLUMNS.map((col, ci) => {
          const w = colWidths[ci] ?? col.width
          const active = ci === cursorCol
          const ind = col.sortable ? sortInd(col.id) : ' '
          return (
            <Box key={col.id} width={w + 1}>
              <Text bold color={active ? 'white' : 'gray'}>
                {pad(col.header, w - 2, col.align)} {ind}
              </Text>
            </Box>
          )
        })}
        {showScroll && <Box width={2}><Text> </Text></Box>}
      </Box>

      {/* Separator */}
      <Text dimColor wrap="truncate-end">{'\u2500'.repeat(200)}</Text>

      {/* Rows */}
      <Box flexDirection="column">
        {visible.map((row, vi) => {
          const ri = scrollOff + vi
          const activeRow = ri === cursorRow
          const sel = selected.has(ri)
          const even = vi % 2 === 0

          return (
            <Box key={ri}>
              <Box width={SEL_W}>
                <Text color={sel ? colors.success : undefined}>{sel ? ' \u2714' : '  '}</Text>
              </Box>
              {COLUMNS.map((col, ci) => {
                const w = colWidths[ci] ?? col.width
                const val = String(row[col.id] ?? '')
                const activeCell = activeRow && ci === cursorCol
                const isStatus = col.id === 'status'

                let fg: string | undefined
                if (activeCell) fg = 'black'
                else if (isStatus) fg = statusColor(val, colors)
                else if (activeRow) fg = 'white'

                let bg: string | undefined
                if (activeCell) bg = colors.primary
                else if (activeRow) bg = '#333333'
                else if (!even) bg = '#1a1a1a'

                return (
                  <Box key={col.id} width={w + 1}>
                    <Text
                      color={fg}
                      backgroundColor={bg}
                      bold={activeCell}
                      dimColor={!activeRow && !isStatus}
                    >
                      {pad(val, w, col.align)}
                    </Text>
                  </Box>
                )
              })}
              {showScroll && (
                <Box width={2}>
                  <Text color={colors.primary}>
                    {vi >= thumbStart && vi < thumbStart + thumbSize ? ' \u2588' : ' \u2502'}
                  </Text>
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      {/* Footer */}
      <Text dimColor wrap="truncate-end">{'\u2500'.repeat(200)}</Text>
      <Box gap={1}>
        <Text dimColor>Row {total > 0 ? cursorRow + 1 : 0}/{total}</Text>
        {selected.size > 0 && (
          <>
            <Text dimColor>{'\u2022'}</Text>
            <Text color={colors.success}>{selected.size} selected</Text>
          </>
        )}
        {sorts.length > 0 && (
          <>
            <Text dimColor>{'\u2022'}</Text>
            <Text dimColor>Sort: </Text>
            <Text color={colors.warning}>{sortDesc()}</Text>
          </>
        )}
      </Box>

      {/* Help */}
      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> {'\u2190\u2191\u2192\u2193'} </Text><Text dimColor> navigate</Text></Box>
        <Box><Text inverse bold> s </Text><Text dimColor> sort</Text></Box>
        <Box><Text inverse bold> space </Text><Text dimColor> select</Text></Box>
        <Box><Text inverse bold> / </Text><Text dimColor> filter</Text></Box>
        <Box><Text inverse bold> +/- </Text><Text dimColor> resize</Text></Box>
      </Box>
    </Box>
  )
}
