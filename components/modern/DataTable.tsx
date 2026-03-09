import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Badge } from './utils'

/* ── Types ── */

interface Column {
  key: string
  label: string
  width: number
  align?: 'left' | 'right'
}

interface Row {
  id: string
  [key: string]: string
}

/* ── State ── */

interface State {
  cursorRow: number
  cursorCol: number
  sortCol: string | null
  sortDir: 'asc' | 'desc'
  selected: Set<string>
  viewStart: number
  filterMode: boolean
  filter: string
}

type Action =
  | { type: 'up' }
  | { type: 'down' }
  | { type: 'left' }
  | { type: 'right' }
  | { type: 'page_up' }
  | { type: 'page_down' }
  | { type: 'sort'; col: string }
  | { type: 'toggle_select'; id: string }
  | { type: 'select_all'; ids: string[] }
  | { type: 'clear_select' }
  | { type: 'enter_filter' }
  | { type: 'exit_filter' }
  | { type: 'filter_char'; ch: string }
  | { type: 'filter_backspace' }

const VIEW_SIZE = 10

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'up': return { ...state, cursorRow: Math.max(0, state.cursorRow - 1) }
    case 'down': return { ...state, cursorRow: state.cursorRow + 1 }
    case 'left': return { ...state, cursorCol: Math.max(0, state.cursorCol - 1) }
    case 'right': return { ...state, cursorCol: state.cursorCol + 1 }
    case 'page_up': return { ...state, cursorRow: Math.max(0, state.cursorRow - VIEW_SIZE) }
    case 'page_down': return { ...state, cursorRow: state.cursorRow + VIEW_SIZE }
    case 'sort': {
      if (state.sortCol === action.col) {
        return { ...state, sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
      }
      return { ...state, sortCol: action.col, sortDir: 'asc' }
    }
    case 'toggle_select': {
      const next = new Set(state.selected)
      if (next.has(action.id)) next.delete(action.id); else next.add(action.id)
      return { ...state, selected: next }
    }
    case 'select_all': return { ...state, selected: new Set(action.ids) }
    case 'clear_select': return { ...state, selected: new Set() }
    case 'enter_filter': return { ...state, filterMode: true, filter: '' }
    case 'exit_filter': return { ...state, filterMode: false }
    case 'filter_char': return { ...state, filter: state.filter + action.ch, cursorRow: 0 }
    case 'filter_backspace': return { ...state, filter: state.filter.slice(0, -1), cursorRow: 0 }
  }
}

/* ── Demo data ── */

const COLUMNS: Column[] = [
  { key: 'name', label: 'Name', width: 14 },
  { key: 'status', label: 'Status', width: 10 },
  { key: 'cpu', label: 'CPU', width: 6, align: 'right' },
  { key: 'mem', label: 'Memory', width: 8, align: 'right' },
  { key: 'region', label: 'Region', width: 12 },
]

const ROWS: Row[] = [
  { id: '1', name: 'api-gateway', status: 'running', cpu: '23%', mem: '256MB', region: 'us-east-1' },
  { id: '2', name: 'auth-service', status: 'running', cpu: '12%', mem: '128MB', region: 'us-east-1' },
  { id: '3', name: 'user-service', status: 'running', cpu: '45%', mem: '512MB', region: 'us-west-2' },
  { id: '4', name: 'payment-svc', status: 'stopped', cpu: '0%', mem: '0MB', region: 'eu-west-1' },
  { id: '5', name: 'email-worker', status: 'running', cpu: '8%', mem: '64MB', region: 'us-east-1' },
  { id: '6', name: 'cdn-proxy', status: 'running', cpu: '67%', mem: '1024MB', region: 'ap-south-1' },
  { id: '7', name: 'log-ingest', status: 'pending', cpu: '0%', mem: '0MB', region: 'us-east-1' },
  { id: '8', name: 'cache-redis', status: 'running', cpu: '15%', mem: '2048MB', region: 'us-east-1' },
  { id: '9', name: 'search-svc', status: 'running', cpu: '34%', mem: '768MB', region: 'us-west-2' },
  { id: '10', name: 'ml-inference', status: 'running', cpu: '89%', mem: '4096MB', region: 'us-west-2' },
  { id: '11', name: 'cron-jobs', status: 'running', cpu: '5%', mem: '32MB', region: 'eu-west-1' },
  { id: '12', name: 'websocket', status: 'stopped', cpu: '0%', mem: '0MB', region: 'us-east-1' },
  { id: '13', name: 'file-storage', status: 'running', cpu: '18%', mem: '384MB', region: 'ap-south-1' },
  { id: '14', name: 'notification', status: 'pending', cpu: '0%', mem: '0MB', region: 'eu-west-1' },
  { id: '15', name: 'analytics', status: 'running', cpu: '56%', mem: '1536MB', region: 'us-east-1' },
]

/* ── Main ── */

export function ModernDataTable() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    cursorRow: 0, cursorCol: 0, sortCol: null, sortDir: 'asc' as const,
    selected: new Set<string>(), viewStart: 0, filterMode: false, filter: '',
  })

  // Filter
  const filtered = state.filter
    ? ROWS.filter(r => Object.values(r).some(v => v.toLowerCase().includes(state.filter.toLowerCase())))
    : ROWS

  // Sort
  const sorted = state.sortCol
    ? [...filtered].sort((a, b) => {
        const va = a[state.sortCol!] ?? ''
        const vb = b[state.sortCol!] ?? ''
        const cmp = va.localeCompare(vb, undefined, { numeric: true })
        return state.sortDir === 'asc' ? cmp : -cmp
      })
    : filtered

  const maxRow = sorted.length - 1
  const maxCol = COLUMNS.length - 1
  const crow = Math.max(0, Math.min(state.cursorRow, maxRow))
  const ccol = Math.max(0, Math.min(state.cursorCol, maxCol))

  // Viewport
  let viewStart = state.viewStart
  if (crow < viewStart) viewStart = crow
  if (crow >= viewStart + VIEW_SIZE) viewStart = crow - VIEW_SIZE + 1
  viewStart = Math.max(0, Math.min(viewStart, sorted.length - VIEW_SIZE))

  const visibleRows = sorted.slice(viewStart, viewStart + VIEW_SIZE)

  useInput((ch, key) => {
    if (state.filterMode) {
      if (key.escape || key.return) { dispatch({ type: 'exit_filter' }); return }
      if (key.backspace || key.delete) { dispatch({ type: 'filter_backspace' }); return }
      if (ch && !key.ctrl && !key.meta && ch.length === 1) { dispatch({ type: 'filter_char', ch }); return }
      return
    }

    if (key.upArrow || ch === 'k') dispatch({ type: 'up' })
    else if (key.downArrow || ch === 'j') dispatch({ type: 'down' })
    else if (key.leftArrow || ch === 'h') dispatch({ type: 'left' })
    else if (key.rightArrow || ch === 'l') dispatch({ type: 'right' })
    else if (ch === 's') dispatch({ type: 'sort', col: COLUMNS[ccol]!.key })
    else if (ch === ' ') {
      const row = sorted[crow]
      if (row) dispatch({ type: 'toggle_select', id: row.id })
    }
    else if (ch === 'a') dispatch({ type: 'select_all', ids: sorted.map(r => r.id) })
    else if (ch === 'x') dispatch({ type: 'clear_select' })
    else if (ch === '/') dispatch({ type: 'enter_filter' })
  })

  function statusColor(status: string): string {
    if (status === 'running') return colors.success
    if (status === 'stopped') return colors.error
    return colors.warning
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>Services</Text>
          <Box gap={2}>
            {state.selected.size > 0 && <Badge label={`${state.selected.size} selected`} color={colors.info} />}
            {state.filter && <Badge label={`filter: ${state.filter}`} color={colors.warning} />}
            <Text dimColor>{sorted.length} rows</Text>
          </Box>
        </Box>

        {state.filterMode && (
          <Box marginBottom={1}>
            <Text color={colors.info}>{'\u276F'} </Text>
            <Text color={colors.info}>{state.filter}</Text>
            <Text dimColor>_</Text>
          </Box>
        )}

        {/* Header */}
        <Box>
          <Text dimColor>  </Text>
          {COLUMNS.map((col, ci) => {
            const active = ci === ccol
            const isSorted = state.sortCol === col.key
            const arrow = isSorted ? (state.sortDir === 'asc' ? ' \u2191' : ' \u2193') : ''
            const label = (col.label + arrow).padEnd(col.width).slice(0, col.width)
            return (
              <Box key={col.key} width={col.width + 1}>
                <Text bold={active} underline color={active ? colors.primary : undefined}>{label}</Text>
              </Box>
            )
          })}
        </Box>

        <Text dimColor wrap="truncate-end">{'\u2500'.repeat(100)}</Text>

        {/* Rows */}
        {visibleRows.map((row, vi) => {
          const realIdx = viewStart + vi
          const active = realIdx === crow
          const isSelected = state.selected.has(row.id)
          const stripe = vi % 2 === 1

          return (
            <Box key={row.id}>
              <Text color={isSelected ? colors.success : active ? colors.primary : 'gray'}>
                {isSelected ? '\u25A0 ' : active ? '\u276F ' : '  '}
              </Text>
              {COLUMNS.map((col, ci) => {
                const cellActive = active && ci === ccol
                const value = row[col.key] ?? ''
                const isStatus = col.key === 'status'
                const padded = col.align === 'right'
                  ? value.padStart(col.width).slice(0, col.width)
                  : value.padEnd(col.width).slice(0, col.width)

                return (
                  <Box key={col.key} width={col.width + 1}>
                    {isStatus ? (
                      <Text color={statusColor(value)} bold={cellActive}>
                        {value === 'running' ? '\u25CF ' : value === 'stopped' ? '\u25CB ' : '\u25D4 '}
                        {value}
                      </Text>
                    ) : (
                      <Text
                        bold={cellActive}
                        color={cellActive ? colors.primary : undefined}
                        dimColor={stripe && !active}
                      >
                        {padded}
                      </Text>
                    )}
                  </Box>
                )
              })}
            </Box>
          )
        })}

        {sorted.length > VIEW_SIZE && (
          <Box marginTop={0}>
            <Text dimColor>  {viewStart + 1}-{Math.min(viewStart + VIEW_SIZE, sorted.length)} of {sorted.length}</Text>
          </Box>
        )}

        <HelpFooter keys={[
          { key: 'hjkl', label: 'navigate' },
          { key: 's', label: 'sort' },
          { key: 'space', label: 'select' },
          { key: '/', label: 'filter' },
        ]} />
      </Card>
    </Box>
  )
}
