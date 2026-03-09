import { useReducer, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Badge, Separator } from './utils'

/* ── Types ── */

interface ListItem {
  id: string
  label: string
  description: string
  tag: string
  tagColor: string
}

/* ── State ── */

interface State {
  cursor: number
  filter: string
  filterMode: boolean
  selected: Set<string>
  statusMessage: string | null
  viewStart: number
}

type Action =
  | { type: 'up' }
  | { type: 'down' }
  | { type: 'page_up' }
  | { type: 'page_down' }
  | { type: 'first' }
  | { type: 'last'; max: number }
  | { type: 'toggle_select'; id: string }
  | { type: 'select_all'; ids: string[] }
  | { type: 'clear_selection' }
  | { type: 'enter_filter' }
  | { type: 'exit_filter' }
  | { type: 'filter_char'; ch: string }
  | { type: 'filter_backspace' }
  | { type: 'set_status'; msg: string }
  | { type: 'clear_status' }
  | { type: 'scroll'; cursor: number; viewSize: number; max: number }

const VIEW_SIZE = 10

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'up': return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'down': return { ...state, cursor: state.cursor + 1 }
    case 'page_up': return { ...state, cursor: Math.max(0, state.cursor - VIEW_SIZE) }
    case 'page_down': return { ...state, cursor: state.cursor + VIEW_SIZE }
    case 'first': return { ...state, cursor: 0 }
    case 'last': return { ...state, cursor: action.max - 1 }
    case 'toggle_select': {
      const next = new Set(state.selected)
      if (next.has(action.id)) next.delete(action.id); else next.add(action.id)
      return { ...state, selected: next }
    }
    case 'select_all': return { ...state, selected: new Set(action.ids) }
    case 'clear_selection': return { ...state, selected: new Set() }
    case 'enter_filter': return { ...state, filterMode: true, filter: '', cursor: 0 }
    case 'exit_filter': return { ...state, filterMode: false, filter: '', cursor: 0 }
    case 'filter_char': return { ...state, filter: state.filter + action.ch, cursor: 0 }
    case 'filter_backspace': return { ...state, filter: state.filter.slice(0, -1), cursor: 0 }
    case 'set_status': return { ...state, statusMessage: action.msg }
    case 'clear_status': return { ...state, statusMessage: null }
    case 'scroll': {
      let vs = state.viewStart
      if (action.cursor < vs) vs = action.cursor
      if (action.cursor >= vs + action.viewSize) vs = action.cursor - action.viewSize + 1
      return { ...state, viewStart: Math.max(0, Math.min(vs, action.max - action.viewSize)) }
    }
    default: return state
  }
}

/* ── Fuzzy match ── */

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++
  }
  return qi === q.length
}

/* ── Demo data ── */

function makeItems(colors: ReturnType<typeof useTheme>): ListItem[] {
  return [
    { id: 'btn', label: 'Button', description: 'Interactive click target', tag: 'core', tagColor: colors.primary },
    { id: 'inp', label: 'Input', description: 'Text entry field', tag: 'core', tagColor: colors.primary },
    { id: 'sel', label: 'Select', description: 'Dropdown selection', tag: 'core', tagColor: colors.primary },
    { id: 'chk', label: 'Checkbox', description: 'Toggle boolean value', tag: 'core', tagColor: colors.primary },
    { id: 'radio', label: 'Radio', description: 'Single option from group', tag: 'core', tagColor: colors.primary },
    { id: 'modal', label: 'Modal', description: 'Overlay dialog', tag: 'overlay', tagColor: colors.secondary },
    { id: 'toast', label: 'Toast', description: 'Notification popup', tag: 'overlay', tagColor: colors.secondary },
    { id: 'tooltip', label: 'Tooltip', description: 'Hover information', tag: 'overlay', tagColor: colors.secondary },
    { id: 'tbl', label: 'Table', description: 'Data grid display', tag: 'data', tagColor: colors.info },
    { id: 'list', label: 'List', description: 'Ordered collection', tag: 'data', tagColor: colors.info },
    { id: 'tree', label: 'Tree', description: 'Hierarchical view', tag: 'data', tagColor: colors.info },
    { id: 'tabs', label: 'Tabs', description: 'Tabbed navigation', tag: 'nav', tagColor: colors.success },
    { id: 'bread', label: 'Breadcrumb', description: 'Path navigation', tag: 'nav', tagColor: colors.success },
    { id: 'page', label: 'Pagination', description: 'Page navigation', tag: 'nav', tagColor: colors.success },
    { id: 'prog', label: 'Progress', description: 'Loading indicator', tag: 'feedback', tagColor: colors.warning },
    { id: 'spin', label: 'Spinner', description: 'Activity indicator', tag: 'feedback', tagColor: colors.warning },
    { id: 'alert', label: 'Alert', description: 'Status message', tag: 'feedback', tagColor: colors.warning },
    { id: 'avatar', label: 'Avatar', description: 'User identity', tag: 'display', tagColor: colors.error },
    { id: 'badge', label: 'Badge', description: 'Status indicator', tag: 'display', tagColor: colors.error },
    { id: 'card', label: 'Card', description: 'Content container', tag: 'display', tagColor: colors.error },
  ]
}

/* ── Main ── */

export function ModernList() {
  const colors = useTheme()
  const allItems = makeItems(colors)
  const [state, dispatch] = useReducer(reducer, {
    cursor: 0, filter: '', filterMode: false, selected: new Set<string>(),
    statusMessage: null, viewStart: 0,
  })
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtered = state.filter
    ? allItems.filter(item => fuzzyMatch(item.label, state.filter) || fuzzyMatch(item.tag, state.filter))
    : allItems

  const clampedCursor = Math.max(0, Math.min(state.cursor, filtered.length - 1))
  if (clampedCursor !== state.cursor && filtered.length > 0) {
    // Will be clamped in render
  }

  useEffect(() => {
    dispatch({ type: 'scroll', cursor: clampedCursor, viewSize: VIEW_SIZE, max: filtered.length })
  }, [clampedCursor, filtered.length])

  function showStatus(msg: string) {
    if (statusTimer.current) clearTimeout(statusTimer.current)
    dispatch({ type: 'set_status', msg })
    statusTimer.current = setTimeout(() => dispatch({ type: 'clear_status' }), 2000)
  }

  useInput((ch, key) => {
    if (state.filterMode) {
      if (key.escape) { dispatch({ type: 'exit_filter' }); return }
      if (key.backspace || key.delete) { dispatch({ type: 'filter_backspace' }); return }
      if (key.return) { dispatch({ type: 'exit_filter' }); return }
      if (ch && !key.ctrl && !key.meta && ch.length === 1) { dispatch({ type: 'filter_char', ch }); return }
      return
    }

    if (key.upArrow || ch === 'k') dispatch({ type: 'up' })
    else if (key.downArrow || ch === 'j') dispatch({ type: 'down' })
    else if (ch === 'g') dispatch({ type: 'first' })
    else if (ch === 'G') dispatch({ type: 'last', max: filtered.length })
    else if (ch === '/') dispatch({ type: 'enter_filter' })
    else if (ch === ' ') {
      const item = filtered[clampedCursor]
      if (item) dispatch({ type: 'toggle_select', id: item.id })
    }
    else if (ch === 'a') dispatch({ type: 'select_all', ids: filtered.map(i => i.id) })
    else if (ch === 'x') dispatch({ type: 'clear_selection' })
    else if (key.return) {
      const item = filtered[clampedCursor]
      if (item) showStatus(`Selected: ${item.label}`)
    }
  })

  const visibleItems = filtered.slice(state.viewStart, state.viewStart + VIEW_SIZE)
  const hasMore = filtered.length > state.viewStart + VIEW_SIZE
  const hasPrev = state.viewStart > 0

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>Components</Text>
          <Box gap={2}>
            {state.selected.size > 0 && <Badge label={`${state.selected.size} selected`} color={colors.info} />}
            <Text dimColor>{filtered.length}/{allItems.length}</Text>
          </Box>
        </Box>

        {state.filterMode && (
          <Box marginBottom={1}>
            <Text color={colors.info}>{'\u276F'} </Text>
            <Text color={colors.info}>{state.filter}</Text>
            <Text dimColor>_</Text>
            <Text dimColor> (esc to cancel)</Text>
          </Box>
        )}

        {hasPrev && <Text dimColor>  \u2191 {state.viewStart} more</Text>}

        {visibleItems.map((item, vi) => {
          const realIdx = state.viewStart + vi
          const active = realIdx === clampedCursor
          const isSelected = state.selected.has(item.id)

          return (
            <Box key={item.id} gap={1}>
              <Text color={isSelected ? colors.success : 'gray'}>{isSelected ? '\u25A0' : '\u25A1'}</Text>
              <Text color={active ? colors.primary : undefined}>{active ? '\u276F' : ' '}</Text>
              <Text bold={active} color={active ? colors.primary : undefined}>
                {item.label.padEnd(12)}
              </Text>
              <Text dimColor>{item.description.padEnd(22)}</Text>
              <Text inverse bold color={item.tagColor}> {item.tag} </Text>
            </Box>
          )
        })}

        {hasMore && <Text dimColor>  \u2193 {filtered.length - state.viewStart - VIEW_SIZE} more</Text>}

        {state.statusMessage && (
          <Box marginTop={1}>
            <Text color={colors.success}>{'\u2714'} {state.statusMessage}</Text>
          </Box>
        )}

        <Separator />

        <HelpFooter keys={[
          { key: 'j/k', label: 'navigate' },
          { key: '/', label: 'filter' },
          { key: 'space', label: 'select' },
          { key: 'enter', label: 'open' },
        ]} />
      </Card>
    </Box>
  )
}
