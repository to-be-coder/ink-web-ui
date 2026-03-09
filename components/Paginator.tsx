import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// --- Display types (matching bubbles/paginator) ---

type DisplayType = 'arabic' | 'dots'

// --- State ---

interface State {
  currentPage: number
  displayType: DisplayType
}

type Action =
  | { type: 'next_page'; total: number }
  | { type: 'prev_page' }
  | { type: 'first_page' }
  | { type: 'last_page'; total: number }
  | { type: 'toggle_display' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next_page':
      return { ...state, currentPage: Math.min(state.currentPage + 1, action.total - 1) }
    case 'prev_page':
      return { ...state, currentPage: Math.max(0, state.currentPage - 1) }
    case 'first_page':
      return { ...state, currentPage: 0 }
    case 'last_page':
      return { ...state, currentPage: action.total - 1 }
    case 'toggle_display':
      return { ...state, displayType: state.displayType === 'arabic' ? 'dots' : 'arabic' }
  }
}

// --- Demo data ---

const ITEMS_PER_PAGE = 5

const ALL_ITEMS = [
  { title: 'Getting Started', desc: 'Installation and setup guide' },
  { title: 'Components', desc: 'Core UI component library' },
  { title: 'Layout', desc: 'Flexbox layout system with Yoga' },
  { title: 'Styling', desc: 'Color and style support' },
  { title: 'Input Handling', desc: 'Keyboard and mouse events' },
  { title: 'Hooks', desc: 'useInput, useApp, useStdin hooks' },
  { title: 'Animation', desc: 'Spring-based animations' },
  { title: 'Themes', desc: 'Dark and light theme support' },
  { title: 'Testing', desc: 'Unit and integration testing' },
  { title: 'Performance', desc: 'Optimization techniques' },
  { title: 'Accessibility', desc: 'Screen reader support' },
  { title: 'Deployment', desc: 'Building and publishing' },
  { title: 'API Reference', desc: 'Complete API documentation' },
  { title: 'Changelog', desc: 'Version history and updates' },
  { title: 'Contributing', desc: 'How to contribute' },
  { title: 'FAQ', desc: 'Frequently asked questions' },
  { title: 'Troubleshooting', desc: 'Common issues and fixes' },
  { title: 'Examples', desc: 'Sample applications' },
  { title: 'Plugins', desc: 'Third-party plugin system' },
  { title: 'Migration', desc: 'Upgrading from v1 to v2' },
]

// --- Paginator display views ---

function ArabicPaginator({ current, total, colors }: { current: number; total: number; colors: ReturnType<typeof useTheme> }) {
  return (
    <Box gap={1}>
      <Text color={current > 0 ? colors.primary : 'gray'}>{'◀'}</Text>
      <Text bold>{current + 1}</Text>
      <Text dimColor>/</Text>
      <Text bold>{total}</Text>
      <Text color={current < total - 1 ? colors.primary : 'gray'}>{'▶'}</Text>
    </Box>
  )
}

function DotsPaginator({ current, total, colors }: { current: number; total: number; colors: ReturnType<typeof useTheme> }) {
  const dots = Array.from({ length: total }, (_, i) =>
    i === current ? '●' : '∙',
  )
  return (
    <Box gap={0}>
      {dots.map((dot, i) => (
        <Text key={i} color={i === current ? colors.primary : 'gray'}>
          {dot}
        </Text>
      ))}
    </Box>
  )
}

// --- Component ---

export function Paginator() {
  const colors = useTheme()
  const totalPages = Math.ceil(ALL_ITEMS.length / ITEMS_PER_PAGE)

  const [state, dispatch] = useReducer(reducer, {
    currentPage: 0,
    displayType: 'arabic',
  })

  const { currentPage, displayType } = state

  useInput((ch, key) => {
    if (key.rightArrow || ch === 'l' || ch === 'n') {
      dispatch({ type: 'next_page', total: totalPages })
    } else if (key.leftArrow || ch === 'h' || ch === 'p') {
      dispatch({ type: 'prev_page' })
    } else if (ch === 'g') {
      dispatch({ type: 'first_page' })
    } else if (ch === 'G') {
      dispatch({ type: 'last_page', total: totalPages })
    } else if (ch === 't') {
      dispatch({ type: 'toggle_display' })
    }
  })

  const startIdx = currentPage * ITEMS_PER_PAGE
  const pageItems = ALL_ITEMS.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>
          Paginator
        </Text>
        <Text dimColor>
          {ALL_ITEMS.length} items, {ITEMS_PER_PAGE} per page
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {pageItems.map((item, i) => {
          const globalIdx = startIdx + i
          return (
            <Box key={globalIdx} gap={1}>
              <Text dimColor>
                {String(globalIdx + 1).padStart(2, ' ')}.
              </Text>
              <Text bold color="white">
                {item.title}
              </Text>
              <Text dimColor>— {item.desc}</Text>
            </Box>
          )
        })}
        {/* Pad empty rows if last page is short */}
        {pageItems.length < ITEMS_PER_PAGE &&
          Array.from({ length: ITEMS_PER_PAGE - pageItems.length }, (_, i) => (
            <Box key={`empty-${i}`}>
              <Text> </Text>
            </Box>
          ))}
      </Box>

      <Box marginBottom={1} justifyContent="center">
        {displayType === 'arabic' ? (
          <ArabicPaginator current={currentPage} total={totalPages} colors={colors} />
        ) : (
          <DotsPaginator current={currentPage} total={totalPages} colors={colors} />
        )}
      </Box>

      <Box gap={2}>
        <Box>
          <Text inverse bold> ←→ </Text>
          <Text dimColor> page</Text>
        </Box>
        <Box>
          <Text inverse bold> g/G </Text>
          <Text dimColor> first/last</Text>
        </Box>
        <Box>
          <Text inverse bold> t </Text>
          <Text dimColor> {displayType === 'arabic' ? 'dots' : 'arabic'}</Text>
        </Box>
      </Box>
    </Box>
  )
}
