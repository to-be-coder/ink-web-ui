import { useReducer, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// --- Types (matching bubbles/list pattern) ---

interface Item {
  title: string
  description: string
  filterValue: string
}

// --- State ---

const VIEWPORT_SIZE = 12

interface State {
  cursor: number
  filterQuery: string
  filterMode: boolean
  statusMessage: string
  statusTimer: number
  showHelp: boolean
}

type Action =
  | { type: 'cursor_up' }
  | { type: 'cursor_down'; max: number }
  | { type: 'page_up' }
  | { type: 'page_down'; max: number }
  | { type: 'go_first' }
  | { type: 'go_last'; max: number }
  | { type: 'enter_filter' }
  | { type: 'exit_filter' }
  | { type: 'clear_filter' }
  | { type: 'filter_char'; char: string }
  | { type: 'filter_backspace' }
  | { type: 'set_status'; msg: string }
  | { type: 'clear_status' }
  | { type: 'toggle_help' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'cursor_up':
      return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'cursor_down':
      return { ...state, cursor: Math.min(action.max - 1, state.cursor + 1) }
    case 'page_up':
      return { ...state, cursor: Math.max(0, state.cursor - VIEWPORT_SIZE) }
    case 'page_down':
      return { ...state, cursor: Math.min(action.max - 1, state.cursor + VIEWPORT_SIZE) }
    case 'go_first':
      return { ...state, cursor: 0 }
    case 'go_last':
      return { ...state, cursor: Math.max(0, action.max - 1) }
    case 'enter_filter':
      return { ...state, filterMode: true, filterQuery: '' }
    case 'exit_filter':
      return { ...state, filterMode: false }
    case 'clear_filter':
      return { ...state, filterMode: false, filterQuery: '', cursor: 0 }
    case 'filter_char':
      return { ...state, filterQuery: state.filterQuery + action.char, cursor: 0 }
    case 'filter_backspace':
      return { ...state, filterQuery: state.filterQuery.slice(0, -1), cursor: 0 }
    case 'set_status':
      return { ...state, statusMessage: action.msg, statusTimer: Date.now() }
    case 'clear_status':
      return { ...state, statusMessage: '' }
    case 'toggle_help':
      return { ...state, showHelp: !state.showHelp }
  }
}

// --- Fuzzy matching (simplified) ---

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

// --- Demo data ---

const ALL_ITEMS: Item[] = [
  { title: 'Accordion', description: 'Expandable/collapsible content sections', filterValue: 'accordion expand collapse' },
  { title: 'Alert', description: 'Feedback banners for status messages', filterValue: 'alert feedback banner' },
  { title: 'Avatar', description: 'Circular user profile images', filterValue: 'avatar profile image user' },
  { title: 'Badge', description: 'Small count or status indicators', filterValue: 'badge count indicator' },
  { title: 'Breadcrumb', description: 'Navigation path hierarchy', filterValue: 'breadcrumb navigation path' },
  { title: 'Button', description: 'Clickable action triggers', filterValue: 'button action click trigger' },
  { title: 'Calendar', description: 'Date selection grid display', filterValue: 'calendar date picker selection' },
  { title: 'Card', description: 'Contained content surface', filterValue: 'card surface container' },
  { title: 'Checkbox', description: 'Binary toggle selection', filterValue: 'checkbox toggle check' },
  { title: 'Chip', description: 'Compact labeled elements', filterValue: 'chip tag label compact' },
  { title: 'Dialog', description: 'Modal overlay for focused tasks', filterValue: 'dialog modal overlay popup' },
  { title: 'Divider', description: 'Visual content separator', filterValue: 'divider separator line' },
  { title: 'Dropdown', description: 'Collapsible selection menu', filterValue: 'dropdown menu select' },
  { title: 'Input', description: 'Text entry field', filterValue: 'input text field entry' },
  { title: 'Menu', description: 'Navigable action list', filterValue: 'menu action list navigation' },
  { title: 'Progress', description: 'Visual completion indicator', filterValue: 'progress bar loading' },
  { title: 'Radio', description: 'Single selection from group', filterValue: 'radio select group single' },
  { title: 'Slider', description: 'Range value selector', filterValue: 'slider range value' },
  { title: 'Switch', description: 'On/off toggle control', filterValue: 'switch toggle on off' },
  { title: 'Table', description: 'Structured data display', filterValue: 'table data grid structured' },
  { title: 'Tabs', description: 'Content section switcher', filterValue: 'tabs section switcher' },
  { title: 'Toast', description: 'Temporary notification popup', filterValue: 'toast notification popup temporary' },
  { title: 'Tooltip', description: 'Contextual hover information', filterValue: 'tooltip hover info context' },
  { title: 'Tree', description: 'Hierarchical data browser', filterValue: 'tree hierarchy browser' },
]

// --- Component ---

export function List() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    cursor: 0,
    filterQuery: '',
    filterMode: false,
    statusMessage: '',
    statusTimer: 0,
    showHelp: false,
  })

  const { cursor, filterQuery, filterMode, statusMessage, showHelp } = state

  // Filter items
  const filteredItems = filterQuery
    ? ALL_ITEMS.filter((item) => fuzzyMatch(filterQuery, item.filterValue))
    : ALL_ITEMS

  // Auto-clear status message after 2s
  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => dispatch({ type: 'clear_status' }), 2000)
    return () => clearTimeout(timer)
  }, [statusMessage, state.statusTimer])

  // Clamp cursor
  const clampedCursor = Math.min(cursor, Math.max(0, filteredItems.length - 1))

  // Viewport
  const total = filteredItems.length
  let scrollOff = 0
  if (clampedCursor >= VIEWPORT_SIZE) {
    scrollOff = Math.min(clampedCursor - VIEWPORT_SIZE + 1, Math.max(0, total - VIEWPORT_SIZE))
  }
  const visibleItems = filteredItems.slice(scrollOff, scrollOff + VIEWPORT_SIZE)

  useInput((ch, key) => {
    if (filterMode) {
      if (key.escape) dispatch({ type: 'exit_filter' })
      else if (key.backspace) dispatch({ type: 'filter_backspace' })
      else if (key.return) dispatch({ type: 'exit_filter' })
      else if (key.ctrl && ch === 'x') dispatch({ type: 'clear_filter' })
      else if (ch && !key.ctrl && !key.meta && ch.length === 1 && ch >= ' ') {
        dispatch({ type: 'filter_char', char: ch })
      }
      return
    }

    if (key.upArrow || ch === 'k') dispatch({ type: 'cursor_up' })
    else if (key.downArrow || ch === 'j') dispatch({ type: 'cursor_down', max: total })
    else if (key.pageUp) dispatch({ type: 'page_up' })
    else if (key.pageDown) dispatch({ type: 'page_down', max: total })
    else if (ch === 'g') dispatch({ type: 'go_first' })
    else if (ch === 'G') dispatch({ type: 'go_last', max: total })
    else if (ch === '/') dispatch({ type: 'enter_filter' })
    else if (key.escape) dispatch({ type: 'clear_filter' })
    else if (key.return) {
      const item = filteredItems[clampedCursor]
      if (item) dispatch({ type: 'set_status', msg: `Selected: ${item.title}` })
    }
    else if (ch === '?') dispatch({ type: 'toggle_help' })
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={0} justifyContent="space-between">
        <Box gap={2}>
          <Text bold color={colors.primary}>List</Text>
          <Text dimColor>
            {total} item{total !== 1 ? 's' : ''}
            {filterQuery && ` (filtered from ${ALL_ITEMS.length})`}
          </Text>
        </Box>
      </Box>

      {/* Filter bar */}
      {filterMode && (
        <Box>
          <Text color={colors.warning}>/ </Text>
          <Text>{filterQuery}</Text>
          <Text color="gray">_</Text>
        </Box>
      )}
      {!filterMode && filterQuery && (
        <Box>
          <Text dimColor>filter: </Text>
          <Text color={colors.warning}>{filterQuery}</Text>
        </Box>
      )}

      <Box><Text dimColor>{'─'.repeat(50)}</Text></Box>

      {/* Items */}
      <Box flexDirection="column">
        {total === 0 ? (
          <Box marginY={1}>
            <Text dimColor>No items match your filter.</Text>
          </Box>
        ) : (
          visibleItems.map((item, vi) => {
            const globalIdx = scrollOff + vi
            const isActive = globalIdx === clampedCursor

            return (
              <Box key={item.title} flexDirection="column">
                <Box gap={1}>
                  <Text color={isActive ? colors.primary : 'gray'}>
                    {isActive ? '▸' : ' '}
                  </Text>
                  <Text
                    color={isActive ? 'white' : undefined}
                    bold={isActive}
                  >
                    {item.title}
                  </Text>
                </Box>
                <Box marginLeft={3}>
                  <Text dimColor>{item.description}</Text>
                </Box>
              </Box>
            )
          })
        )}
      </Box>

      <Box><Text dimColor>{'─'.repeat(50)}</Text></Box>

      {/* Status bar */}
      <Box justifyContent="space-between">
        <Text dimColor>
          {total > 0 ? `${clampedCursor + 1}/${total}` : '0/0'}
        </Text>
        {statusMessage && (
          <Text color={colors.success}>{statusMessage}</Text>
        )}
      </Box>

      {/* Help */}
      {showHelp ? (
        <Box flexDirection="column" marginTop={1}>
          <Box gap={4}>
            <Box flexDirection="column">
              <Text bold color={colors.secondary}>Navigation</Text>
              <Text><Text bold color={colors.primary}>j/k</Text><Text dimColor>  up/down</Text></Text>
              <Text><Text bold color={colors.primary}>g/G</Text><Text dimColor>  top/bot</Text></Text>
              <Text><Text bold color={colors.primary}>pgU/D</Text><Text dimColor> page</Text></Text>
            </Box>
            <Box flexDirection="column">
              <Text bold color={colors.secondary}>Actions</Text>
              <Text><Text bold color={colors.primary}>enter</Text><Text dimColor> select</Text></Text>
              <Text><Text bold color={colors.primary}>/</Text><Text dimColor>     filter</Text></Text>
              <Text><Text bold color={colors.primary}>esc</Text><Text dimColor>   clear</Text></Text>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box marginTop={0} gap={2}>
          <Box><Text inverse bold> j/k </Text><Text dimColor> nav</Text></Box>
          <Box><Text inverse bold> / </Text><Text dimColor> filter</Text></Box>
          <Box><Text inverse bold> enter </Text><Text dimColor> select</Text></Box>
          <Box><Text inverse bold> ? </Text><Text dimColor> help</Text></Box>
        </Box>
      )}
    </Box>
  )
}
