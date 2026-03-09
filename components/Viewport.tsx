import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

const VIEWPORT_HEIGHT = 18

const CONTENT = [
  '# ink-web',
  '',
  'React for terminals, rendered in the browser via xterm.js.',
  '',
  '## Features',
  '',
  '- Full React component model for terminal UIs',
  '- Flexbox layout via Yoga',
  '- Keyboard input handling with useInput hook',
  '- Color and style support (bold, dim, italic, etc.)',
  '- xterm.js integration for browser rendering',
  '- Server-side rendering support',
  '',
  '## Installation',
  '',
  '```bash',
  'npm install ink-web react',
  '```',
  '',
  '## Quick Start',
  '',
  '```tsx',
  'import { Box, Text } from "ink-web";',
  '',
  'function App() {',
  '  return (',
  '    <Box flexDirection="column">',
  '      <Text bold color="green">Hello, terminal!</Text>',
  '      <Text dimColor>Rendered in the browser.</Text>',
  '    </Box>',
  '  );',
  '}',
  '```',
  '',
  '## Components',
  '',
  'ink-web provides a set of primitive components:',
  '',
  '- **Box** - Flexbox container for layout',
  '- **Text** - Styled text output',
  '- **Newline** - Line break',
  '- **Spacer** - Flexible space filler',
  '',
  '## Hooks',
  '',
  '- **useInput** - Handle keyboard input',
  '- **useApp** - Access app-level controls',
  '- **useStdin** - Access raw stdin stream',
  '- **useStdout** - Access raw stdout stream',
  '',
  '## Layout',
  '',
  'ink-web uses Yoga for flexbox layout. All Box props',
  'map to standard CSS flexbox properties:',
  '',
  '```tsx',
  '<Box flexDirection="row" gap={2} padding={1}>',
  '  <Box width="50%"><Text>Left</Text></Box>',
  '  <Box width="50%"><Text>Right</Text></Box>',
  '</Box>',
  '```',
  '',
  '## Keyboard Input',
  '',
  '```tsx',
  'import { useInput } from "ink-web";',
  '',
  'function MyComponent() {',
  '  useInput((input, key) => {',
  '    if (key.escape) process.exit();',
  '    if (key.return) submit();',
  '  });',
  '}',
  '```',
  '',
  '## Color Support',
  '',
  'Full 256-color and hex color support:',
  '',
  '```tsx',
  '<Text color="#FF71CE">Pink</Text>',
  '<Text color="rgb(5, 255, 161)">Green</Text>',
  '<Text backgroundColor="blue">Highlighted</Text>',
  '```',
  '',
  '## License',
  '',
  'MIT (c) 2025 ink-web contributors',
]

/* ── State ── */

interface State {
  scrollY: number
  searchQuery: string
  searchMode: boolean
  searchMatches: number[]
  searchIdx: number
  showLineNumbers: boolean
}

type Action =
  | { type: 'scroll_down' }
  | { type: 'scroll_up' }
  | { type: 'half_down' }
  | { type: 'half_up' }
  | { type: 'to_top' }
  | { type: 'to_bottom' }
  | { type: 'start_search' }
  | { type: 'end_search' }
  | { type: 'search_type'; ch: string }
  | { type: 'search_del' }
  | { type: 'next_match' }
  | { type: 'prev_match' }
  | { type: 'toggle_lines' }

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function findMatches(query: string): number[] {
  if (!query) return []
  const q = query.toLowerCase()
  const matches: number[] = []
  for (let i = 0; i < CONTENT.length; i++) {
    if (CONTENT[i]!.toLowerCase().includes(q)) matches.push(i)
  }
  return matches
}

function reducer(state: State, action: Action): State {
  const maxScroll = Math.max(0, CONTENT.length - VIEWPORT_HEIGHT)

  switch (action.type) {
    case 'scroll_down':
      return { ...state, scrollY: Math.min(maxScroll, state.scrollY + 1) }
    case 'scroll_up':
      return { ...state, scrollY: Math.max(0, state.scrollY - 1) }
    case 'half_down':
      return { ...state, scrollY: Math.min(maxScroll, state.scrollY + Math.floor(VIEWPORT_HEIGHT / 2)) }
    case 'half_up':
      return { ...state, scrollY: Math.max(0, state.scrollY - Math.floor(VIEWPORT_HEIGHT / 2)) }
    case 'to_top':
      return { ...state, scrollY: 0 }
    case 'to_bottom':
      return { ...state, scrollY: maxScroll }
    case 'start_search':
      return { ...state, searchMode: true, searchQuery: '', searchMatches: [], searchIdx: 0 }
    case 'end_search':
      return { ...state, searchMode: false }
    case 'search_type': {
      const q = state.searchQuery + action.ch
      const matches = findMatches(q)
      const scrollY = matches.length > 0 ? clamp(matches[0]!, 0, maxScroll) : state.scrollY
      return { ...state, searchQuery: q, searchMatches: matches, searchIdx: 0, scrollY }
    }
    case 'search_del': {
      const q = state.searchQuery.slice(0, -1)
      const matches = findMatches(q)
      return { ...state, searchQuery: q, searchMatches: matches, searchIdx: 0 }
    }
    case 'next_match': {
      if (state.searchMatches.length === 0) return state
      const idx = (state.searchIdx + 1) % state.searchMatches.length
      const line = state.searchMatches[idx]!
      return { ...state, searchIdx: idx, scrollY: clamp(line, 0, maxScroll) }
    }
    case 'prev_match': {
      if (state.searchMatches.length === 0) return state
      const idx = (state.searchIdx - 1 + state.searchMatches.length) % state.searchMatches.length
      const line = state.searchMatches[idx]!
      return { ...state, searchIdx: idx, scrollY: clamp(line, 0, maxScroll) }
    }
    case 'toggle_lines':
      return { ...state, showLineNumbers: !state.showLineNumbers }
  }
}

/* ── Component ── */

export function Viewport() {
  const colors = useTheme()

  const [state, dispatch] = useReducer(reducer, {
    scrollY: 0,
    searchQuery: '',
    searchMode: false,
    searchMatches: [],
    searchIdx: 0,
    showLineNumbers: true,
  })

  const { scrollY, searchQuery, searchMode, searchMatches, searchIdx, showLineNumbers } = state

  useInput((ch, key) => {
    if (searchMode) {
      if (key.escape) dispatch({ type: 'end_search' })
      else if (key.return) dispatch({ type: 'end_search' })
      else if (key.backspace || key.delete) dispatch({ type: 'search_del' })
      else if (ch === 'n' && key.ctrl) dispatch({ type: 'next_match' })
      else if (ch === 'p' && key.ctrl) dispatch({ type: 'prev_match' })
      else if (ch && !key.ctrl && !key.meta) dispatch({ type: 'search_type', ch })
      return
    }

    if (ch === 'j' || key.downArrow) dispatch({ type: 'scroll_down' })
    else if (ch === 'k' || key.upArrow) dispatch({ type: 'scroll_up' })
    else if (ch === 'd' || key.pageDown) dispatch({ type: 'half_down' })
    else if (ch === 'u' || key.pageUp) dispatch({ type: 'half_up' })
    else if (ch === 'g') dispatch({ type: 'to_top' })
    else if (ch === 'G') dispatch({ type: 'to_bottom' })
    else if (ch === '/') dispatch({ type: 'start_search' })
    else if (ch === 'n') dispatch({ type: 'next_match' })
    else if (ch === 'N') dispatch({ type: 'prev_match' })
    else if (ch === 'l') dispatch({ type: 'toggle_lines' })
  })

  const visibleLines = CONTENT.slice(scrollY, scrollY + VIEWPORT_HEIGHT)
  const maxScroll = Math.max(0, CONTENT.length - VIEWPORT_HEIGHT)
  const pct = maxScroll > 0 ? Math.round((scrollY / maxScroll) * 100) : 0

  // Scrollbar
  const thumbH = Math.max(1, Math.round(VIEWPORT_HEIGHT / CONTENT.length * VIEWPORT_HEIGHT))
  const thumbPos = maxScroll > 0 ? Math.round(scrollY / maxScroll * (VIEWPORT_HEIGHT - thumbH)) : 0

  const lineNumW = String(scrollY + VIEWPORT_HEIGHT).length
  const matchLineSet = new Set(searchMatches)
  const currentMatchLine = searchMatches[searchIdx]

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1} justifyContent="space-between">
        <Box gap={2}>
          <Text bold color={colors.primary}>Viewport</Text>
          <Text color="white">README.md</Text>
        </Box>
        <Text dimColor>
          {scrollY === 0 ? 'Top' : scrollY >= maxScroll ? 'Bot' : `${pct}%`}
        </Text>
      </Box>

      {/* Search bar */}
      {searchMode && (
        <Box marginBottom={0}>
          <Text color={colors.warning}>/ </Text>
          <Text>{searchQuery}</Text>
          <Text color="gray">_</Text>
          {searchMatches.length > 0 && (
            <Text dimColor>  {searchIdx + 1}/{searchMatches.length} matches</Text>
          )}
        </Box>
      )}
      {!searchMode && searchQuery && (
        <Box marginBottom={0}>
          <Text dimColor>search: </Text>
          <Text color={colors.warning}>{searchQuery}</Text>
          <Text dimColor>  {searchMatches.length} matches</Text>
        </Box>
      )}

      {/* Content */}
      <Box flexDirection="row">
        <Box flexDirection="column" flexGrow={1}>
          {visibleLines.map((line, i) => {
            const lineNum = scrollY + i + 1
            const absLine = scrollY + i
            const isMatch = matchLineSet.has(absLine)
            const isCurrentMatch = absLine === currentMatchLine

            return (
              <Box key={i}>
                {showLineNumbers && (
                  <>
                    <Text dimColor>{String(lineNum).padStart(lineNumW, ' ')}</Text>
                    <Text dimColor> {'\u2502'} </Text>
                  </>
                )}
                <Text
                  color={isCurrentMatch ? 'black' : undefined}
                  backgroundColor={isCurrentMatch ? colors.warning : isMatch ? '#333300' : undefined}
                >
                  {line}
                </Text>
              </Box>
            )
          })}
        </Box>

        {/* Scrollbar */}
        <Box flexDirection="column" marginLeft={1}>
          {Array.from({ length: VIEWPORT_HEIGHT }, (_, i) => {
            const isThumb = i >= thumbPos && i < thumbPos + thumbH
            return (
              <Text key={i} color={isThumb ? colors.primary : 'gray'}>
                {isThumb ? '\u2588' : '\u2502'}
              </Text>
            )
          })}
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1} justifyContent="space-between">
        <Text dimColor>
          Line {scrollY + 1}-{Math.min(scrollY + VIEWPORT_HEIGHT, CONTENT.length)} of {CONTENT.length}
        </Text>
        <Box gap={2}>
          <Box><Text inverse bold> j/k </Text><Text dimColor> scroll</Text></Box>
          <Box><Text inverse bold> d/u </Text><Text dimColor> page</Text></Box>
          <Box><Text inverse bold> / </Text><Text dimColor> search</Text></Box>
          <Box><Text inverse bold> l </Text><Text dimColor> lines</Text></Box>
        </Box>
      </Box>
    </Box>
  )
}
