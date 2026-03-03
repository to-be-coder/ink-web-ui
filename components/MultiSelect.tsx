import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface Option {
  label: string
  value: string
  description?: string
  group?: string
}

interface State {
  cursor: number
  selected: Set<string>
  filterQuery: string
  filterMode: boolean
  submitted: boolean
}

type Action =
  | { type: 'move_up' }
  | { type: 'move_down'; max: number }
  | { type: 'select_all'; values: string[] }
  | { type: 'clear' }
  | { type: 'submit' }
  | { type: 'reset' }
  | { type: 'enter_filter' }
  | { type: 'exit_filter' }
  | { type: 'filter_char'; char: string }
  | { type: 'filter_backspace' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'move_up':
      return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'move_down':
      return { ...state, cursor: Math.min(action.max - 1, state.cursor + 1) }
    case 'select_all':
      return { ...state, selected: new Set(action.values) }
    case 'clear':
      return { ...state, selected: new Set() }
    case 'submit':
      return { ...state, submitted: true }
    case 'reset':
      return { cursor: 0, selected: new Set(), filterQuery: '', filterMode: false, submitted: false }
    case 'enter_filter':
      return { ...state, filterMode: true, filterQuery: '', cursor: 0 }
    case 'exit_filter':
      return { ...state, filterMode: false }
    case 'filter_char':
      return { ...state, filterQuery: state.filterQuery + action.char, cursor: 0 }
    case 'filter_backspace':
      return { ...state, filterQuery: state.filterQuery.slice(0, -1), cursor: 0 }
  }
}

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

export function MultiSelect() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    cursor: 0,
    selected: new Set<string>(),
    filterQuery: '',
    filterMode: false,
    submitted: false,
  })

  const { cursor, selected, filterQuery, filterMode, submitted } = state

  let filtered = OPTIONS
  if (filterQuery) {
    const q = filterQuery.toLowerCase()
    filtered = OPTIONS.filter(o =>
      o.label.toLowerCase().includes(q) ||
      o.value.toLowerCase().includes(q) ||
      (o.description && o.description.toLowerCase().includes(q)) ||
      (o.group && o.group.toLowerCase().includes(q))
    )
  }

  useInput((ch, key) => {
    if (submitted) {
      if (ch === 'r') dispatch({ type: 'reset' })
      return
    }

    if (filterMode) {
      if (key.escape || key.return) dispatch({ type: 'exit_filter' })
      else if (key.backspace || key.delete) dispatch({ type: 'filter_backspace' })
      else if (ch && !key.ctrl && !key.meta) dispatch({ type: 'filter_char', char: ch })
      return
    }

    if (ch === 'j' || key.downArrow) dispatch({ type: 'move_down', max: filtered.length })
    else if (ch === 'k' || key.upArrow) dispatch({ type: 'move_up' })
    else if (ch === ' ') {
      const item = filtered[cursor]
      if (item) {
        const next = new Set(selected)
        if (next.has(item.value)) next.delete(item.value)
        else next.add(item.value)
        dispatch({ type: 'select_all', values: [...next] })
      }
    }
    else if (ch === 'a') dispatch({ type: 'select_all', values: filtered.map(o => o.value) })
    else if (ch === 'x') dispatch({ type: 'clear' })
    else if (key.return) dispatch({ type: 'submit' })
    else if (ch === '/') dispatch({ type: 'enter_filter' })
    else if (ch === 'r') dispatch({ type: 'reset' })
  })

  if (submitted) {
    const selectedOptions = OPTIONS.filter(o => selected.has(o.value))
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box marginBottom={1} gap={1}>
          <Text color={colors.success}>✔</Text>
          <Text bold>Select your stack</Text>
          <Text dimColor>{selectedOptions.length} selected</Text>
        </Box>

        {selectedOptions.length === 0 ? (
          <Text dimColor>  No items selected.</Text>
        ) : (
          selectedOptions.map(o => (
            <Box key={o.value} gap={1}>
              <Text>  </Text>
              <Text color={colors.success}>✔</Text>
              <Text bold>{o.label}</Text>
              <Text dimColor>{o.description}</Text>
            </Box>
          ))
        )}

        <Box marginTop={1} gap={1}>
          <Text dimColor>Press</Text>
          <Text bold>r</Text>
          <Text dimColor>to reset</Text>
        </Box>
      </Box>
    )
  }

  const scrollOffset = Math.max(0, Math.min(cursor - VISIBLE + 3, filtered.length - VISIBLE))
  const visStart = Math.max(0, scrollOffset)
  const visible = filtered.slice(visStart, visStart + VISIBLE)

  let lastGroup = ''

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={1}>
        <Text color={colors.info}>?</Text>
        <Text bold>Select your stack</Text>
        <Text dimColor>({selected.size} selected)</Text>
      </Box>

      {filterMode && (
        <Box marginBottom={1} gap={1}>
          <Text color={colors.primary}>›</Text>
          <Text>{filterQuery}</Text>
          <Text dimColor>_</Text>
          {filterQuery && <Text dimColor>{filtered.length} matches</Text>}
        </Box>
      )}
      {!filterMode && filterQuery && (
        <Box marginBottom={1} gap={1}>
          <Text dimColor>filter:</Text>
          <Text color={colors.primary}>{filterQuery}</Text>
          <Text dimColor>{filtered.length} matches</Text>
        </Box>
      )}

      <Box flexDirection="column">
        {visible.map((option, i) => {
          const idx = visStart + i
          const isActive = idx === cursor
          const isSelected = selected.has(option.value)
          const showGroup = option.group && option.group !== lastGroup
          lastGroup = option.group || ''

          return (
            <Box key={option.value} flexDirection="column">
              {showGroup && idx > 0 && (
                <Box>
                  <Text> </Text>
                </Box>
              )}
              {showGroup && (
                <Box>
                  <Text dimColor>  {option.group}</Text>
                </Box>
              )}
              <Box gap={1}>
                <Text color={isActive ? colors.primary : undefined}>{isActive ? '❯' : ' '}</Text>
                <Text color={isSelected ? colors.success : 'gray'}>{isSelected ? '◉' : '◯'}</Text>
                <Text
                  color={isActive ? colors.primary : isSelected ? colors.success : undefined}
                  bold={isActive}
                >
                  {option.label}
                </Text>
                {option.description && (
                  <Text dimColor>{option.description}</Text>
                )}
              </Box>
            </Box>
          )
        })}
      </Box>

      {filtered.length > VISIBLE && (
        <Box marginTop={0}>
          <Text dimColor>
            {'  '}{visStart + 1}-{Math.min(visStart + VISIBLE, filtered.length)} of {filtered.length}
          </Text>
        </Box>
      )}

      <Box marginTop={1} gap={1}>
        <Text dimColor>
          <Text bold>space</Text> toggle  <Text bold>a</Text> all  <Text bold>x</Text> none  <Text bold>enter</Text> confirm  <Text bold>/</Text> filter
        </Text>
      </Box>
    </Box>
  )
}
