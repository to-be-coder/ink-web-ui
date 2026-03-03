import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

/* ────────────────────── Column definition ────────────────────── */

interface Column {
  id: string
  header: string
  accessor: string
  sortable: boolean
  width: number
  align: 'left' | 'right' | 'center'
}

interface Row {
  [key: string]: string | number
}

/* ────────────────────── Sort descriptor ────────────────────── */

interface SortEntry {
  colId: string
  direction: 'asc' | 'desc'
}

/* ────────────────────── State ────────────────────── */

interface State {
  cursorRow: number
  cursorCol: number
  sorts: SortEntry[]
  filterQuery: string
  filterMode: boolean
  selectedRows: Set<number>
  scrollOffset: number
}

type Action =
  | { type: 'move_up' }
  | { type: 'move_down'; max: number }
  | { type: 'move_left' }
  | { type: 'move_right'; max: number }
  | { type: 'page_up' }
  | { type: 'page_down'; max: number }
  | { type: 'go_first' }
  | { type: 'go_last'; max: number }
  | { type: 'toggle_sort'; colId: string }
  | { type: 'add_sort'; colId: string }
  | { type: 'toggle_select'; rowIndex: number }
  | { type: 'select_all'; max: number }
  | { type: 'clear_selection' }
  | { type: 'enter_filter' }
  | { type: 'exit_filter' }
  | { type: 'clear_filter' }
  | { type: 'filter_char'; char: string }
  | { type: 'filter_backspace' }
  | { type: 'set_scroll'; offset: number }

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'move_up':
      return { ...state, cursorRow: Math.max(0, state.cursorRow - 1) }
    case 'move_down':
      return { ...state, cursorRow: Math.min(action.max - 1, state.cursorRow + 1) }
    case 'move_left':
      return { ...state, cursorCol: Math.max(0, state.cursorCol - 1) }
    case 'move_right':
      return { ...state, cursorCol: Math.min(action.max - 1, state.cursorCol + 1) }
    case 'page_up':
      return { ...state, cursorRow: Math.max(0, state.cursorRow - 10) }
    case 'page_down':
      return { ...state, cursorRow: Math.min(action.max - 1, state.cursorRow + 10) }
    case 'go_first':
      return { ...state, cursorRow: 0 }
    case 'go_last':
      return { ...state, cursorRow: Math.max(0, action.max - 1) }
    case 'toggle_sort': {
      const existing = state.sorts.find(s => s.colId === action.colId)
      let next: SortEntry[]
      if (!existing) {
        next = [{ colId: action.colId, direction: 'asc' }]
      } else if (existing.direction === 'asc') {
        next = [{ colId: action.colId, direction: 'desc' }]
      } else {
        next = []
      }
      return { ...state, sorts: next, cursorRow: 0 }
    }
    case 'add_sort': {
      const existing = state.sorts.find(s => s.colId === action.colId)
      if (!existing) {
        return { ...state, sorts: [...state.sorts, { colId: action.colId, direction: 'asc' }], cursorRow: 0 }
      } else if (existing.direction === 'asc') {
        return {
          ...state,
          sorts: state.sorts.map(s => s.colId === action.colId ? { ...s, direction: 'desc' as const } : s),
          cursorRow: 0,
        }
      } else {
        return {
          ...state,
          sorts: state.sorts.filter(s => s.colId !== action.colId),
          cursorRow: 0,
        }
      }
    }
    case 'toggle_select': {
      const next = new Set(state.selectedRows)
      if (next.has(action.rowIndex)) next.delete(action.rowIndex)
      else next.add(action.rowIndex)
      return { ...state, selectedRows: next }
    }
    case 'select_all': {
      const all = new Set<number>()
      for (let i = 0; i < action.max; i++) all.add(i)
      return { ...state, selectedRows: all }
    }
    case 'clear_selection':
      return { ...state, selectedRows: new Set() }
    case 'enter_filter':
      return { ...state, filterMode: true, filterQuery: '', cursorRow: 0 }
    case 'exit_filter':
      return { ...state, filterMode: false }
    case 'clear_filter':
      return { ...state, filterMode: false, filterQuery: '', cursorRow: 0 }
    case 'filter_char':
      return { ...state, filterQuery: state.filterQuery + action.char, cursorRow: 0 }
    case 'filter_backspace':
      return { ...state, filterQuery: state.filterQuery.slice(0, -1), cursorRow: 0 }
    case 'set_scroll':
      return { ...state, scrollOffset: action.offset }
  }
}

/* ────────────────────── Column definitions ────────────────────── */

const COLUMNS: Column[] = [
  { id: 'name',   header: 'Name',      accessor: 'name',   sortable: true,  width: 16, align: 'left' },
  { id: 'status', header: 'Status',    accessor: 'status', sortable: true,  width: 9,  align: 'left' },
  { id: 'cpu',    header: 'CPU%',      accessor: 'cpu',    sortable: true,  width: 7,  align: 'right' },
  { id: 'memory', header: 'Mem MB',    accessor: 'memory', sortable: true,  width: 8,  align: 'right' },
  { id: 'uptime', header: 'Uptime',    accessor: 'uptime', sortable: true,  width: 10, align: 'left' },
  { id: 'region', header: 'Region',    accessor: 'region', sortable: true,  width: 10, align: 'left' },
]

const SEL_COL_WIDTH = 3

/* ────────────────────── Demo data (20 rows) ────────────────────── */

const ROWS: Row[] = [
  { name: 'api-gateway',    status: 'running', cpu: 12.4, memory: 256,  uptime: '14d 3h',  region: 'us-east-1' },
  { name: 'auth-service',   status: 'running', cpu: 8.2,  memory: 128,  uptime: '14d 3h',  region: 'us-east-1' },
  { name: 'worker-01',      status: 'running', cpu: 67.8, memory: 512,  uptime: '7d 12h',  region: 'us-west-2' },
  { name: 'worker-02',      status: 'running', cpu: 43.1, memory: 384,  uptime: '7d 12h',  region: 'us-west-2' },
  { name: 'cache-redis',    status: 'running', cpu: 3.5,  memory: 1200, uptime: '30d 1h',  region: 'us-east-1' },
  { name: 'db-primary',     status: 'running', cpu: 22.7, memory: 2100, uptime: '30d 1h',  region: 'us-east-1' },
  { name: 'db-replica',     status: 'stopped', cpu: 0.0,  memory: 0,    uptime: '-',        region: 'us-east-1' },
  { name: 'queue-rabbit',   status: 'running', cpu: 5.3,  memory: 340,  uptime: '21d 8h',  region: 'eu-west-1' },
  { name: 'ml-inference',   status: 'running', cpu: 89.2, memory: 4200, uptime: '2d 6h',   region: 'us-west-2' },
  { name: 'scheduler',      status: 'pending', cpu: 0.0,  memory: 0,    uptime: '-',        region: 'us-east-1' },
  { name: 'monitoring',     status: 'running', cpu: 6.1,  memory: 192,  uptime: '14d 3h',  region: 'eu-west-1' },
  { name: 'cdn-proxy',      status: 'running', cpu: 15.9, memory: 96,   uptime: '60d 2h',  region: 'ap-south-1' },
  { name: 'log-collector',  status: 'running', cpu: 11.3, memory: 280,  uptime: '14d 3h',  region: 'us-east-1' },
  { name: 'email-service',  status: 'stopped', cpu: 0.0,  memory: 0,    uptime: '-',        region: 'eu-west-1' },
  { name: 'cron-jobs',      status: 'running', cpu: 1.8,  memory: 64,   uptime: '45d 0h',  region: 'us-east-1' },
  { name: 'search-engine',  status: 'running', cpu: 34.5, memory: 1800, uptime: '10d 4h',  region: 'us-west-2' },
  { name: 'file-storage',   status: 'running', cpu: 7.9,  memory: 220,  uptime: '30d 1h',  region: 'ap-south-1' },
  { name: 'notification',   status: 'pending', cpu: 0.0,  memory: 0,    uptime: '-',        region: 'us-east-1' },
  { name: 'analytics',      status: 'running', cpu: 28.3, memory: 960,  uptime: '5d 11h',  region: 'eu-west-1' },
  { name: 'billing-svc',    status: 'running', cpu: 4.6,  memory: 148,  uptime: '14d 3h',  region: 'us-east-1' },
]

/* ────────────────────── Helpers ────────────────────── */

function pad(str: string, width: number, align: 'left' | 'right' | 'center' = 'left'): string {
  const s = str.length > width ? str.slice(0, width) : str
  const remaining = width - s.length
  if (align === 'right') return ' '.repeat(remaining) + s
  if (align === 'center') {
    const left = Math.floor(remaining / 2)
    return ' '.repeat(left) + s + ' '.repeat(remaining - left)
  }
  return s + ' '.repeat(remaining)
}

function statusColor(value: string, colors: ReturnType<typeof useTheme>): string | undefined {
  if (value === 'running') return colors.success
  if (value === 'stopped') return colors.error
  if (value === 'pending') return colors.warning
  return undefined
}

function isNumericColumn(colId: string): boolean {
  return colId === 'cpu' || colId === 'memory'
}

const VIEWPORT = 15

/* ────────────────────── Component ────────────────────── */

export function DataTable() {
  const colors = useTheme()

  const [state, dispatch] = useReducer(reducer, {
    cursorRow: 0,
    cursorCol: 0,
    sorts: [],
    filterQuery: '',
    filterMode: false,
    selectedRows: new Set<number>(),
    scrollOffset: 0,
  })

  const { cursorRow, cursorCol, sorts, filterQuery, filterMode, selectedRows } = state

  /* ── Filter ── */
  let filteredRows = ROWS
  if (filterQuery) {
    const q = filterQuery.toLowerCase()
    filteredRows = ROWS.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    )
  }

  /* ── Sort ── */
  const sortedRows = [...filteredRows]
  if (sorts.length > 0) {
    sortedRows.sort((a, b) => {
      for (const entry of sorts) {
        const col = COLUMNS.find(c => c.id === entry.colId)
        if (!col) continue
        const va = a[col.accessor]
        const vb = b[col.accessor]
        let cmp = 0
        if (isNumericColumn(col.id)) {
          cmp = (Number(va) || 0) - (Number(vb) || 0)
        } else {
          cmp = String(va).localeCompare(String(vb))
        }
        if (entry.direction === 'desc') cmp = -cmp
        if (cmp !== 0) return cmp
      }
      return 0
    })
  }

  const totalRows = sortedRows.length

  /* ── Scroll ── */
  const maxScroll = Math.max(0, totalRows - VIEWPORT)
  let scrollOff = state.scrollOffset
  // Ensure cursor is visible
  if (cursorRow < scrollOff) scrollOff = cursorRow
  if (cursorRow >= scrollOff + VIEWPORT) scrollOff = cursorRow - VIEWPORT + 1
  scrollOff = clamp(scrollOff, 0, maxScroll)

  const visibleRows = sortedRows.slice(scrollOff, scrollOff + VIEWPORT)

  /* ── Scrollbar ── */
  const showScrollbar = totalRows > VIEWPORT
  let thumbStart = 0
  let thumbSize = VIEWPORT
  if (showScrollbar && totalRows > 0) {
    thumbSize = Math.max(1, Math.round((VIEWPORT / totalRows) * VIEWPORT))
    thumbStart = Math.round((scrollOff / maxScroll) * (VIEWPORT - thumbSize))
  }

  /* ── Sort indicator for a column ── */
  function sortIndicator(colId: string): string {
    const entry = sorts.find(s => s.colId === colId)
    if (!entry) return '\u00B7'  // middle dot
    return entry.direction === 'asc' ? '\u25B2' : '\u25BC'
  }

  /* ── Sort description for footer ── */
  function sortDescription(): string {
    if (sorts.length === 0) return ''
    return sorts.map(s => {
      const col = COLUMNS.find(c => c.id === s.colId)
      return `${col?.header ?? s.colId} ${s.direction === 'asc' ? '\u25B2' : '\u25BC'}`
    }).join(', ')
  }

  /* ── Input handling ── */
  useInput((ch, key) => {
    if (filterMode) {
      if (key.escape) dispatch({ type: 'exit_filter' })
      else if (key.ctrl && ch === 'x') dispatch({ type: 'clear_filter' })
      else if (key.backspace || key.delete) dispatch({ type: 'filter_backspace' })
      else if (ch && !key.ctrl && !key.meta) dispatch({ type: 'filter_char', char: ch })
      return
    }

    if (key.upArrow) dispatch({ type: 'move_up' })
    else if (key.downArrow) dispatch({ type: 'move_down', max: totalRows })
    else if (key.leftArrow) dispatch({ type: 'move_left' })
    else if (key.rightArrow) dispatch({ type: 'move_right', max: COLUMNS.length })
    else if (key.pageUp) dispatch({ type: 'page_up' })
    else if (key.pageDown) dispatch({ type: 'page_down', max: totalRows })
    else if (ch === 'g') dispatch({ type: 'go_first' })
    else if (ch === 'G') dispatch({ type: 'go_last', max: totalRows })
    else if (ch === 's') {
      const col = COLUMNS[cursorCol]
      if (col && col.sortable) dispatch({ type: 'toggle_sort', colId: col.id })
    }
    else if (ch === 'S') {
      const col = COLUMNS[cursorCol]
      if (col && col.sortable) dispatch({ type: 'add_sort', colId: col.id })
    }
    else if (ch === ' ') dispatch({ type: 'toggle_select', rowIndex: cursorRow })
    else if (ch === 'a') dispatch({ type: 'select_all', max: totalRows })
    else if (ch === 'x') dispatch({ type: 'clear_selection' })
    else if (ch === '/') dispatch({ type: 'enter_filter' })
  })

  /* ── Total table width for separator ── */
  const tableWidth = SEL_COL_WIDTH + COLUMNS.reduce((s, c) => s + c.width + 1, 0) + (showScrollbar ? 2 : 0)

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Title bar */}
      <Box marginBottom={0} gap={2}>
        <Text bold color={colors.primary}>DataTable</Text>
        {selectedRows.size > 0 && (
          <Text color={colors.success}>{selectedRows.size} selected</Text>
        )}
      </Box>

      {/* Filter bar */}
      {filterMode && (
        <Box>
          <Text color={colors.warning}>/ </Text>
          <Text>{filterQuery}</Text>
          <Text color="gray">_</Text>
          <Text dimColor>  {filteredRows.length}/{ROWS.length} rows</Text>
        </Box>
      )}
      {!filterMode && filterQuery && (
        <Box>
          <Text dimColor>filter: </Text>
          <Text color={colors.warning}>{filterQuery}</Text>
          <Text dimColor>  {filteredRows.length}/{ROWS.length} rows</Text>
        </Box>
      )}

      {/* Header row */}
      <Box>
        <Box width={SEL_COL_WIDTH}>
          <Text dimColor> </Text>
        </Box>
        {COLUMNS.map((col, ci) => {
          const isActiveCol = ci === cursorCol
          const indicator = col.sortable ? sortIndicator(col.id) : ' '
          return (
            <Box key={col.id} width={col.width + 1}>
              <Text bold color={isActiveCol ? 'white' : 'gray'}>
                {pad(col.header, col.width - 2, col.align)}{' '}{indicator}
              </Text>
            </Box>
          )
        })}
        {showScrollbar && <Box width={2}><Text> </Text></Box>}
      </Box>

      {/* Separator */}
      <Box>
        <Text dimColor>{'\u2500'.repeat(tableWidth)}</Text>
      </Box>

      {/* Data rows */}
      <Box flexDirection="column">
        {visibleRows.map((row, vi) => {
          const rowIdx = scrollOff + vi
          const isActiveRow = rowIdx === cursorRow
          const isSelected = selectedRows.has(rowIdx)
          const isEvenRow = vi % 2 === 0

          return (
            <Box key={rowIdx}>
              {/* Selection column */}
              <Box width={SEL_COL_WIDTH}>
                <Text color={isSelected ? colors.success : undefined}>
                  {isSelected ? ' \u2714' : '  '}
                </Text>
              </Box>

              {/* Data cells */}
              {COLUMNS.map((col, ci) => {
                const val = String(row[col.accessor] ?? '')
                const isActiveCell = isActiveRow && ci === cursorCol
                const isStatusCol = col.id === 'status'

                let cellColor: string | undefined
                if (isActiveCell) {
                  cellColor = 'black'
                } else if (isStatusCol) {
                  cellColor = statusColor(val, colors)
                } else if (isActiveRow) {
                  cellColor = 'white'
                } else {
                  cellColor = undefined
                }

                let bgColor: string | undefined
                if (isActiveCell) {
                  bgColor = colors.primary
                } else if (isActiveRow) {
                  bgColor = '#333333'
                } else if (!isEvenRow) {
                  bgColor = '#1a1a1a'
                } else {
                  bgColor = undefined
                }

                return (
                  <Box key={col.id} width={col.width + 1}>
                    <Text
                      color={cellColor}
                      backgroundColor={bgColor}
                      bold={isActiveCell}
                      dimColor={!isActiveRow && !isStatusCol}
                    >
                      {pad(val, col.width, col.align)}
                    </Text>
                  </Box>
                )
              })}

              {/* Scrollbar */}
              {showScrollbar && (
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
      <Box>
        <Text dimColor>{'\u2500'.repeat(tableWidth)}</Text>
      </Box>
      <Box gap={1}>
        <Text dimColor>
          Row {totalRows > 0 ? cursorRow + 1 : 0}/{totalRows}
        </Text>
        {selectedRows.size > 0 && (
          <>
            <Text dimColor>{'\u2022'}</Text>
            <Text color={colors.success}>{selectedRows.size} selected</Text>
          </>
        )}
        {sorts.length > 0 && (
          <>
            <Text dimColor>{'\u2022'}</Text>
            <Text dimColor>Sort: </Text>
            <Text color={colors.warning}>{sortDescription()}</Text>
          </>
        )}
      </Box>

      {/* Help bar */}
      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> {'\u2190\u2191\u2192\u2193'} </Text>
          <Text dimColor> navigate</Text>
        </Box>
        <Box>
          <Text inverse bold> s </Text>
          <Text dimColor> sort</Text>
        </Box>
        <Box>
          <Text inverse bold> space </Text>
          <Text dimColor> select</Text>
        </Box>
        <Box>
          <Text inverse bold> / </Text>
          <Text dimColor> filter</Text>
        </Box>
        <Box>
          <Text inverse bold> g/G </Text>
          <Text dimColor> top/end</Text>
        </Box>
      </Box>
    </Box>
  )
}
