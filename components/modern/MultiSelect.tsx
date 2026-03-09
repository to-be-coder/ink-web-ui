import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, GBar, HelpFooter, Badge, Separator } from './utils'

/* ── Types ── */

interface Option {
  label: string
  value: string
  description: string
  group: string
}

/* ── State ── */

interface State {
  cursor: number
  selected: Set<string>
  submitted: boolean
  filterMode: boolean
  filter: string
}

type Action =
  | { type: 'up' }
  | { type: 'down'; max: number }
  | { type: 'toggle'; value: string }
  | { type: 'select_all'; values: string[] }
  | { type: 'clear' }
  | { type: 'submit' }
  | { type: 'reset' }
  | { type: 'enter_filter' }
  | { type: 'exit_filter' }
  | { type: 'filter_char'; ch: string }
  | { type: 'filter_backspace' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'up': return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'down': return { ...state, cursor: Math.min(action.max - 1, state.cursor + 1) }
    case 'toggle': {
      const next = new Set(state.selected)
      if (next.has(action.value)) next.delete(action.value); else next.add(action.value)
      return { ...state, selected: next }
    }
    case 'select_all': return { ...state, selected: new Set(action.values) }
    case 'clear': return { ...state, selected: new Set() }
    case 'submit': return { ...state, submitted: true }
    case 'reset': return { cursor: 0, selected: new Set(), submitted: false, filterMode: false, filter: '' }
    case 'enter_filter': return { ...state, filterMode: true, filter: '', cursor: 0 }
    case 'exit_filter': return { ...state, filterMode: false }
    case 'filter_char': return { ...state, filter: state.filter + action.ch, cursor: 0 }
    case 'filter_backspace': return { ...state, filter: state.filter.slice(0, -1), cursor: 0 }
  }
}

/* ── Demo data ── */

const OPTIONS: Option[] = [
  { label: 'TypeScript', value: 'typescript', description: 'Typed JavaScript superset', group: 'Languages' },
  { label: 'Python', value: 'python', description: 'General-purpose scripting', group: 'Languages' },
  { label: 'Rust', value: 'rust', description: 'Systems programming', group: 'Languages' },
  { label: 'Go', value: 'go', description: 'Concurrent server language', group: 'Languages' },
  { label: 'React', value: 'react', description: 'UI component library', group: 'Frameworks' },
  { label: 'Next.js', value: 'nextjs', description: 'Full-stack React framework', group: 'Frameworks' },
  { label: 'FastAPI', value: 'fastapi', description: 'Python async web framework', group: 'Frameworks' },
  { label: 'Express', value: 'express', description: 'Node.js HTTP server', group: 'Frameworks' },
  { label: 'PostgreSQL', value: 'postgres', description: 'Relational database', group: 'Infrastructure' },
  { label: 'Redis', value: 'redis', description: 'In-memory data store', group: 'Infrastructure' },
  { label: 'Docker', value: 'docker', description: 'Container runtime', group: 'Infrastructure' },
  { label: 'Kubernetes', value: 'kubernetes', description: 'Container orchestration', group: 'Infrastructure' },
  { label: 'GitHub Actions', value: 'gha', description: 'CI/CD pipelines', group: 'Tools' },
  { label: 'Terraform', value: 'terraform', description: 'Infrastructure as code', group: 'Tools' },
  { label: 'Vitest', value: 'vitest', description: 'Unit testing framework', group: 'Tools' },
  { label: 'ESLint', value: 'eslint', description: 'Code linting', group: 'Tools' },
]

const VISIBLE = 12

/* ── Main ── */

export function ModernMultiSelect() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    cursor: 0, selected: new Set<string>(), submitted: false, filterMode: false, filter: '',
  })

  const filtered = state.filter
    ? OPTIONS.filter(o =>
        o.label.toLowerCase().includes(state.filter.toLowerCase()) ||
        o.group.toLowerCase().includes(state.filter.toLowerCase()) ||
        o.description.toLowerCase().includes(state.filter.toLowerCase()))
    : OPTIONS

  const clampedCursor = Math.max(0, Math.min(state.cursor, filtered.length - 1))

  useInput((ch, key) => {
    if (state.submitted) {
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
    else if (ch === ' ') {
      const item = filtered[clampedCursor]
      if (item) dispatch({ type: 'toggle', value: item.value })
    }
    else if (ch === 'a') dispatch({ type: 'select_all', values: filtered.map(o => o.value) })
    else if (ch === 'x') dispatch({ type: 'clear' })
    else if (key.return) dispatch({ type: 'submit' })
    else if (ch === '/') dispatch({ type: 'enter_filter' })
  })

  if (state.submitted) {
    const selectedOpts = OPTIONS.filter(o => state.selected.has(o.value))
    const groups = [...new Set(selectedOpts.map(o => o.group))]

    return (
      <Box flexDirection="column" paddingX={1}>
        <Card borderColor={colors.success}>
          <Box marginBottom={1} gap={1}>
            <GBar kind="done" />
            <Text bold>Select your stack</Text>
            <Badge label={`${selectedOpts.length} selected`} color={colors.success} />
          </Box>

          {groups.map(group => (
            <Box key={group} flexDirection="column">
              <Box><GBar kind="bar" color={colors.success} /><Text dimColor bold>{group}</Text></Box>
              {selectedOpts.filter(o => o.group === group).map(o => (
                <Box key={o.value} gap={1}>
                  <GBar kind="bar" color={colors.success} />
                  <Text color={colors.success}>{'\u2714'}</Text>
                  <Text bold>{o.label}</Text>
                  <Text dimColor>{o.description}</Text>
                </Box>
              ))}
            </Box>
          ))}

          {selectedOpts.length === 0 && (
            <Box><GBar kind="bar" color={colors.success} /><Text dimColor>No items selected</Text></Box>
          )}

          <Box marginTop={1} gap={1}>
            <Text inverse bold> r </Text>
            <Text dimColor>reset</Text>
          </Box>
        </Card>
      </Box>
    )
  }

  // Scrolling
  const scrollOffset = Math.max(0, Math.min(clampedCursor - VISIBLE + 3, filtered.length - VISIBLE))
  const visStart = Math.max(0, scrollOffset)
  const visible = filtered.slice(visStart, visStart + VISIBLE)

  let lastGroup = ''

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Box gap={1}>
            <GBar kind="active" />
            <Text bold color={colors.primary}>Select your stack</Text>
          </Box>
          <Box gap={1}>
            {state.selected.size > 0 && <Badge label={`${state.selected.size}`} color={colors.success} />}
            <Text dimColor>{filtered.length} items</Text>
          </Box>
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

        {visible.map((option, vi) => {
          const realIdx = visStart + vi
          const active = realIdx === clampedCursor
          const isSelected = state.selected.has(option.value)
          const showGroup = option.group !== lastGroup
          lastGroup = option.group

          return (
            <Box key={option.value} flexDirection="column">
              {showGroup && (
                <Box>
                  <GBar kind="bar" color={colors.primary} />
                  <Text dimColor bold>{option.group}</Text>
                </Box>
              )}
              <Box gap={1}>
                <GBar kind="bar" color={colors.primary} />
                <Text color={active ? colors.primary : 'gray'}>{active ? '\u276F' : ' '}</Text>
                <Text color={isSelected ? colors.success : 'gray'}>
                  {isSelected ? '\u25A0' : '\u25A1'}
                </Text>
                <Text bold={active || isSelected} color={active ? colors.primary : isSelected ? colors.success : undefined}>
                  {option.label}
                </Text>
                {active && <Text dimColor>{option.description}</Text>}
              </Box>
            </Box>
          )
        })}

        {filtered.length > VISIBLE && (
          <Box>
            <GBar kind="bar" color={colors.primary} />
            <Text dimColor>{visStart + 1}-{Math.min(visStart + VISIBLE, filtered.length)} of {filtered.length}</Text>
          </Box>
        )}

        {filtered.length === 0 && (
          <Box>
            <GBar kind="bar" color={colors.primary} />
            <Text dimColor>No matches found</Text>
          </Box>
        )}

        <Separator />

        <HelpFooter keys={[
          { key: 'j/k', label: 'navigate' },
          { key: 'space', label: 'toggle' },
          { key: 'a', label: 'all' },
          { key: 'x', label: 'none' },
          { key: 'enter', label: 'confirm' },
          { key: '/', label: 'filter' },
        ]} />
      </Card>
    </Box>
  )
}
