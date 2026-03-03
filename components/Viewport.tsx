import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

const VIEWPORT_HEIGHT = 18

const DEMO_LINES = [
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

interface State {
  scrollY: number
  contentHeight: number
  viewportHeight: number
}

type Action =
  | { type: 'scroll_down' }
  | { type: 'scroll_up' }
  | { type: 'half_page_down' }
  | { type: 'half_page_up' }
  | { type: 'scroll_to_top' }
  | { type: 'scroll_to_bottom' }

function clampScroll(y: number, contentHeight: number, viewportHeight: number): number {
  return Math.max(0, Math.min(y, contentHeight - viewportHeight))
}

function reducer(state: State, action: Action): State {
  const { contentHeight, viewportHeight } = state
  const maxScroll = contentHeight - viewportHeight
  const halfPage = Math.floor(viewportHeight / 2)

  switch (action.type) {
    case 'scroll_down':
      return { ...state, scrollY: Math.min(maxScroll, state.scrollY + 1) }
    case 'scroll_up':
      return { ...state, scrollY: Math.max(0, state.scrollY - 1) }
    case 'half_page_down':
      return { ...state, scrollY: Math.min(maxScroll, state.scrollY + halfPage) }
    case 'half_page_up':
      return { ...state, scrollY: Math.max(0, state.scrollY - halfPage) }
    case 'scroll_to_top':
      return { ...state, scrollY: 0 }
    case 'scroll_to_bottom':
      return { ...state, scrollY: maxScroll }
  }
}

export function Viewport() {
  const colors = useTheme()

  const contentHeight = DEMO_LINES.length
  const viewportHeight = VIEWPORT_HEIGHT

  const [state, dispatch] = useReducer(reducer, {
    scrollY: 0,
    contentHeight,
    viewportHeight,
  })

  useInput((ch, key) => {
    if (ch === 'j' || key.downArrow) {
      dispatch({ type: 'scroll_down' })
    } else if (ch === 'k' || key.upArrow) {
      dispatch({ type: 'scroll_up' })
    } else if (ch === 'd' || key.pageDown) {
      dispatch({ type: 'half_page_down' })
    } else if (ch === 'u' || key.pageUp) {
      dispatch({ type: 'half_page_up' })
    } else if (ch === 'g') {
      dispatch({ type: 'scroll_to_top' })
    } else if (ch === 'G') {
      dispatch({ type: 'scroll_to_bottom' })
    }
  })

  const { scrollY } = state
  const visibleLines = DEMO_LINES.slice(scrollY, scrollY + viewportHeight)
  const maxScroll = contentHeight - viewportHeight
  const percentage = maxScroll > 0 ? Math.round((scrollY / maxScroll) * 100) : 0

  // Scrollbar calculations
  const trackHeight = viewportHeight
  const thumbHeight = Math.max(1, Math.round(viewportHeight / contentHeight * trackHeight))
  const thumbPosition = maxScroll > 0
    ? Math.round(scrollY / maxScroll * (trackHeight - thumbHeight))
    : 0

  // Line number width
  const maxLineNum = scrollY + viewportHeight
  const lineNumWidth = String(maxLineNum).length

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1} justifyContent="space-between">
        <Box gap={2}>
          <Text bold color={colors.primary}>Viewport</Text>
          <Text color="white">README.md</Text>
        </Box>
        <Text dimColor>
          {scrollY === 0 ? 'Top' : scrollY >= maxScroll ? 'Bot' : `${percentage}%`}
        </Text>
      </Box>

      {/* Content area with scrollbar */}
      <Box flexDirection="row">
        {/* Line numbers + content */}
        <Box flexDirection="column" flexGrow={1}>
          {visibleLines.map((line, i) => {
            const lineNum = scrollY + i + 1
            return (
              <Box key={i}>
                <Text dimColor>
                  {String(lineNum).padStart(lineNumWidth, ' ')}
                </Text>
                <Text dimColor> {'\u2502'} </Text>
                <Text>{line}</Text>
              </Box>
            )
          })}
        </Box>

        {/* Scrollbar */}
        <Box flexDirection="column" marginLeft={1}>
          {Array.from({ length: trackHeight }, (_, i) => {
            const isThumb = i >= thumbPosition && i < thumbPosition + thumbHeight
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
          Line {scrollY + 1}-{Math.min(scrollY + viewportHeight, contentHeight)} of {contentHeight}
        </Text>
        <Box gap={2}>
          <Box>
            <Text inverse bold> j/k </Text>
            <Text dimColor> scroll</Text>
          </Box>
          <Box>
            <Text inverse bold> d/u </Text>
            <Text dimColor> page</Text>
          </Box>
          <Box>
            <Text inverse bold> g/G </Text>
            <Text dimColor> top/bot</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
