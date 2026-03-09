import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, GBar, HelpFooter, type BarSymbol } from './utils'

/* ── Types ── */

interface Option {
  label: string
  value: string
  description: string
  icon: string
}

interface Group {
  title: string
  options: Option[]
}

/* ── State ── */

interface State {
  cursor: number
  confirmed: boolean
  filterMode: boolean
  filter: string
}

type Action =
  | { type: 'up' }
  | { type: 'down'; max: number }
  | { type: 'confirm' }
  | { type: 'reset' }
  | { type: 'enter_filter' }
  | { type: 'exit_filter' }
  | { type: 'filter_char'; ch: string }
  | { type: 'filter_backspace' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'up': return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'down': return { ...state, cursor: Math.min(action.max - 1, state.cursor + 1) }
    case 'confirm': return { ...state, confirmed: true }
    case 'reset': return { cursor: 0, confirmed: false, filterMode: false, filter: '' }
    case 'enter_filter': return { ...state, filterMode: true, filter: '', cursor: 0 }
    case 'exit_filter': return { ...state, filterMode: false }
    case 'filter_char': return { ...state, filter: state.filter + action.ch, cursor: 0 }
    case 'filter_backspace': return { ...state, filter: state.filter.slice(0, -1), cursor: 0 }
  }
}

/* ── Demo data ── */

const GROUPS: Group[] = [
  {
    title: 'Frontend',
    options: [
      { label: 'React', value: 'react', description: 'Component-based UI library', icon: '\u269B' },
      { label: 'Vue', value: 'vue', description: 'Progressive framework', icon: '\u25B2' },
      { label: 'Svelte', value: 'svelte', description: 'Compile-time framework', icon: '\u26A1' },
      { label: 'Angular', value: 'angular', description: 'Full-featured platform', icon: '\u25C6' },
    ],
  },
  {
    title: 'Backend',
    options: [
      { label: 'Node.js', value: 'node', description: 'JavaScript runtime', icon: '\u2B22' },
      { label: 'Deno', value: 'deno', description: 'Secure JS/TS runtime', icon: '\u{1F995}' },
      { label: 'Go', value: 'go', description: 'Fast compiled language', icon: '\u25B6' },
      { label: 'Rust', value: 'rust', description: 'Memory-safe systems lang', icon: '\u2699' },
    ],
  },
  {
    title: 'Database',
    options: [
      { label: 'PostgreSQL', value: 'postgres', description: 'Relational database', icon: '\u{1F418}' },
      { label: 'MongoDB', value: 'mongo', description: 'Document database', icon: '\u{1F343}' },
      { label: 'Redis', value: 'redis', description: 'In-memory store', icon: '\u25CF' },
    ],
  },
]

const ALL_OPTIONS = GROUPS.flatMap(g => g.options)

/* ── Main ── */

export function ModernSelect() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    cursor: 0, confirmed: false, filterMode: false, filter: '',
  })

  const filtered = state.filter
    ? ALL_OPTIONS.filter(o =>
        o.label.toLowerCase().includes(state.filter.toLowerCase()) ||
        o.description.toLowerCase().includes(state.filter.toLowerCase()))
    : ALL_OPTIONS

  const clampedCursor = Math.max(0, Math.min(state.cursor, filtered.length - 1))

  useInput((ch, key) => {
    if (state.confirmed) {
      if (ch === 'r') dispatch({ type: 'reset' })
      return
    }

    if (state.filterMode) {
      if (key.escape || key.return) dispatch({ type: 'exit_filter' })
      else if (key.backspace || key.delete) dispatch({ type: 'filter_backspace' })
      else if (ch && !key.ctrl && !key.meta) dispatch({ type: 'filter_char', ch })
      return
    }

    if (key.upArrow || ch === 'k') dispatch({ type: 'up' })
    else if (key.downArrow || ch === 'j') dispatch({ type: 'down', max: filtered.length })
    else if (key.return) dispatch({ type: 'confirm' })
    else if (ch === '/') dispatch({ type: 'enter_filter' })
  })

  if (state.confirmed) {
    const selected = filtered[clampedCursor]
    return (
      <Box flexDirection="column" paddingX={1}>
        <Card borderColor={colors.success}>
          <Box gap={1}>
            <GBar kind="done" />
            <Text bold>Choose a framework</Text>
          </Box>
          <Box gap={1}>
            <GBar kind="bar" color={colors.success} />
            <Text color={colors.success}>{selected?.icon} {selected?.label}</Text>
            <Text dimColor>{'\u2500'} {selected?.description}</Text>
          </Box>
          <Box marginTop={1} gap={1}>
            <Text inverse bold> r </Text>
            <Text dimColor>reset</Text>
          </Box>
        </Card>
      </Box>
    )
  }

  // Build grouped display for non-filtered view
  let currentGroup = ''

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box marginBottom={1} gap={1}>
          <GBar kind="active" />
          <Text bold color={colors.primary}>Choose a framework</Text>
          <Text dimColor>{'\u2500'} Pick one option</Text>
        </Box>

        {state.filterMode && (
          <Box marginBottom={1}>
            <GBar kind="bar" color={colors.primary} />
            <Text color={colors.info}>{'\u276F'} </Text>
            <Text color={colors.info}>{state.filter}</Text>
            <Text dimColor>_ ({filtered.length} matches)</Text>
          </Box>
        )}
        {!state.filterMode && state.filter && (
          <Box marginBottom={1}>
            <GBar kind="bar" color={colors.primary} />
            <Text dimColor>filter: </Text>
            <Text color={colors.primary}>{state.filter}</Text>
            <Text dimColor> ({filtered.length})</Text>
          </Box>
        )}

        {filtered.map((option, i) => {
          const active = i === clampedCursor
          // Show group header if not filtering
          const group = !state.filter ? GROUPS.find(g => g.options.some(o => o.value === option.value))?.title : undefined
          const showGroup = group && group !== currentGroup
          if (group) currentGroup = group

          return (
            <Box key={option.value} flexDirection="column">
              {showGroup && (
                <Box>
                  <GBar kind="bar" color={colors.primary} />
                  <Text dimColor bold>{group}</Text>
                </Box>
              )}
              <Box gap={1}>
                <GBar kind="bar" color={colors.primary} />
                <Text color={active ? colors.primary : 'gray'}>{active ? '\u276F' : ' '}</Text>
                <Text color={active ? colors.primary : 'gray'}>{active ? '\u25C9' : '\u25EF'}</Text>
                <Text bold={active} color={active ? colors.primary : undefined}>
                  {option.icon} {option.label}
                </Text>
                {active && <Text dimColor>{option.description}</Text>}
              </Box>
            </Box>
          )
        })}

        {filtered.length === 0 && (
          <Box>
            <GBar kind="bar" color={colors.primary} />
            <Text dimColor>No matches found</Text>
          </Box>
        )}

        <HelpFooter keys={[
          { key: 'j/k', label: 'navigate' },
          { key: 'enter', label: 'confirm' },
          { key: '/', label: 'filter' },
        ]} />
      </Card>
    </Box>
  )
}
