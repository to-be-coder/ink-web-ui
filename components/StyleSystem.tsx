import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

type Page = 'borders' | 'text' | 'colors' | 'layout'

interface State {
  page: Page
}

type Action =
  | { type: 'set_page'; page: Page }
  | { type: 'next_page' }

const PAGES: Page[] = ['borders', 'text', 'colors', 'layout']
const PAGE_LABELS: Record<Page, string> = {
  borders: '1: Borders',
  text: '2: Text',
  colors: '3: Colors',
  layout: '4: Layout',
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'set_page':
      return { ...state, page: action.page }
    case 'next_page': {
      const idx = PAGES.indexOf(state.page)
      return { ...state, page: PAGES[(idx + 1) % PAGES.length]! }
    }
  }
}

/* ── Border Renderers ── */

function drawBox(
  content: string,
  width: number,
  tl: string, tr: string, bl: string, br: string,
  h: string, v: string
): string[] {
  const inner = width - 2
  const pad = Math.max(0, inner - content.length)
  const left = Math.floor(pad / 2)
  const right = pad - left
  return [
    tl + h.repeat(inner) + tr,
    v + ' '.repeat(left) + content + ' '.repeat(right) + v,
    bl + h.repeat(inner) + br,
  ]
}

function BordersPage({ colors }: { colors: ReturnType<typeof useTheme> }) {
  const styles: { name: string; tl: string; tr: string; bl: string; br: string; h: string; v: string; color: string }[] = [
    { name: 'rounded', tl: '\u256D', tr: '\u256E', bl: '\u2570', br: '\u256F', h: '\u2500', v: '\u2502', color: colors.primary },
    { name: 'single', tl: '\u250C', tr: '\u2510', bl: '\u2514', br: '\u2518', h: '\u2500', v: '\u2502', color: colors.info },
    { name: 'double', tl: '\u2554', tr: '\u2557', bl: '\u255A', br: '\u255D', h: '\u2550', v: '\u2551', color: colors.success },
    { name: 'thick', tl: '\u250F', tr: '\u2513', bl: '\u2517', br: '\u251B', h: '\u2501', v: '\u2503', color: colors.warning },
    { name: 'hidden', tl: ' ', tr: ' ', bl: ' ', br: ' ', h: ' ', v: ' ', color: colors.secondary },
    { name: 'ASCII', tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|', color: colors.error },
  ]

  const W = 12

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>Border Styles</Text>
      </Box>
      <Box flexDirection="row" gap={1}>
        {styles.map(s => {
          const lines = drawBox(s.name, W, s.tl, s.tr, s.bl, s.br, s.h, s.v)
          return (
            <Box key={s.name} flexDirection="column">
              {lines.map((line, i) => (
                <Text key={i} color={s.color}>{line}</Text>
              ))}
            </Box>
          )
        })}
      </Box>

      <Box marginTop={1} marginBottom={1}>
        <Text bold color={colors.primary}>Nested Borders</Text>
      </Box>
      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column">
          <Text color={colors.info}>{'\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557'}</Text>
          <Text color={colors.info}>{'\u2551'} <Text color={colors.success}>{'\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E'}</Text> {'\u2551'}</Text>
          <Text color={colors.info}>{'\u2551'} <Text color={colors.success}>{'\u2502'}  <Text color={colors.warning}>Double {'>'} Round</Text>  {'\u2502'}</Text> {'\u2551'}</Text>
          <Text color={colors.info}>{'\u2551'} <Text color={colors.success}>{'\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F'}</Text> {'\u2551'}</Text>
          <Text color={colors.info}>{'\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D'}</Text>
        </Box>
        <Box flexDirection="column">
          <Text color={colors.primary}>{'\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513'}</Text>
          <Text color={colors.primary}>{'\u2503'} <Text color={colors.error}>+------------------+</Text> {'\u2503'}</Text>
          <Text color={colors.primary}>{'\u2503'} <Text color={colors.error}>| <Text color={colors.secondary}>Thick {'>'} ASCII</Text>   |</Text> {'\u2503'}</Text>
          <Text color={colors.primary}>{'\u2503'} <Text color={colors.error}>+------------------+</Text> {'\u2503'}</Text>
          <Text color={colors.primary}>{'\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B'}</Text>
        </Box>
      </Box>
    </Box>
  )
}

/* ── Text Decorations Page ── */

function TextPage({ colors }: { colors: ReturnType<typeof useTheme> }) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>Text Decorations</Text>
      </Box>

      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" gap={3}>
          <Box flexDirection="column" width={22}>
            <Text dimColor>{'  '}Style</Text>
            <Text color={colors.info}>{'\u2500'.repeat(22)}</Text>
            <Box gap={1}><Text color={colors.success}>{'\u25CF'}</Text><Text bold>Bold text</Text></Box>
            <Box gap={1}><Text color={colors.success}>{'\u25CF'}</Text><Text italic>Italic text</Text></Box>
            <Box gap={1}><Text color={colors.success}>{'\u25CF'}</Text><Text underline>Underlined text</Text></Box>
            <Box gap={1}><Text color={colors.success}>{'\u25CF'}</Text><Text strikethrough>Strikethrough text</Text></Box>
            <Box gap={1}><Text color={colors.success}>{'\u25CF'}</Text><Text dimColor>Dim text</Text></Box>
            <Box gap={1}><Text color={colors.success}>{'\u25CF'}</Text><Text inverse>Inverse text</Text></Box>
          </Box>

          <Box flexDirection="column" width={30}>
            <Text dimColor>{'  '}Combinations</Text>
            <Text color={colors.info}>{'\u2500'.repeat(30)}</Text>
            <Box gap={1}><Text color={colors.warning}>{'\u25CF'}</Text><Text bold italic>Bold + Italic</Text></Box>
            <Box gap={1}><Text color={colors.warning}>{'\u25CF'}</Text><Text bold underline>Bold + Underline</Text></Box>
            <Box gap={1}><Text color={colors.warning}>{'\u25CF'}</Text><Text italic underline>Italic + Underline</Text></Box>
            <Box gap={1}><Text color={colors.warning}>{'\u25CF'}</Text><Text bold italic underline>Bold + Italic + Underline</Text></Box>
            <Box gap={1}><Text color={colors.warning}>{'\u25CF'}</Text><Text dimColor italic>Dim + Italic</Text></Box>
            <Box gap={1}><Text color={colors.warning}>{'\u25CF'}</Text><Text bold inverse> Bold + Inverse </Text></Box>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} marginBottom={1}>
        <Text bold color={colors.primary}>Colored Text</Text>
      </Box>
      <Box flexDirection="row" gap={1}>
        <Text color={colors.primary} bold>Primary</Text>
        <Text color={colors.secondary} bold>Secondary</Text>
        <Text color={colors.info} bold>Info</Text>
        <Text color={colors.success} bold>Success</Text>
        <Text color={colors.warning} bold>Warning</Text>
        <Text color={colors.error} bold>Error</Text>
      </Box>
      <Box flexDirection="row" gap={1} marginTop={1}>
        <Text color={colors.primary} dimColor>Primary dim</Text>
        <Text color={colors.secondary} dimColor>Secondary dim</Text>
        <Text color={colors.info} dimColor>Info dim</Text>
        <Text color={colors.success} dimColor>Success dim</Text>
        <Text color={colors.warning} dimColor>Warning dim</Text>
        <Text color={colors.error} dimColor>Error dim</Text>
      </Box>
    </Box>
  )
}

/* ── Colors Page ── */

function ColorBlock({ color, label }: { color: string; label: string }) {
  return (
    <Box flexDirection="column" alignItems="center">
      <Text backgroundColor={color}>{'       '}</Text>
      <Text backgroundColor={color}>{'       '}</Text>
      <Text color={color} bold>{label.padStart(7)}</Text>
      <Text dimColor>{color.padStart(7)}</Text>
    </Box>
  )
}

function ColorsPage({ colors }: { colors: ReturnType<typeof useTheme> }) {
  const lightColors = {
    primary: '#D946EF',
    secondary: '#8B5CF6',
    info: '#0EA5E9',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>Color Palette</Text>
      </Box>

      <Box flexDirection="row" gap={1}>
        <ColorBlock color={colors.primary} label="primary" />
        <ColorBlock color={colors.secondary} label="second." />
        <ColorBlock color={colors.info} label="info" />
        <ColorBlock color={colors.success} label="success" />
        <ColorBlock color={colors.warning} label="warning" />
        <ColorBlock color={colors.error} label="error" />
      </Box>

      <Box marginTop={1} marginBottom={1}>
        <Text bold color={colors.primary}>Adaptive Colors</Text>
        <Text dimColor>  (same semantics, different values)</Text>
      </Box>

      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column">
          <Text color={colors.info}>{'\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510'}</Text>
          <Text color={colors.info}>{'\u2502'} <Text bold inverse> Dark Mode (active) </Text>  {'\u2502'}</Text>
          <Text color={colors.info}>{'\u2502'}                         {'\u2502'}</Text>
          <Text color={colors.info}>{'\u2502'} <Text color={colors.primary}>{'\u25A0'} primary  {colors.primary}</Text> {'\u2502'}</Text>
          <Text color={colors.info}>{'\u2502'} <Text color={colors.success}>{'\u25A0'} success  {colors.success}</Text> {'\u2502'}</Text>
          <Text color={colors.info}>{'\u2502'} <Text color={colors.error}>{'\u25A0'} error    {colors.error}</Text> {'\u2502'}</Text>
          <Text color={colors.info}>{'\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518'}</Text>
        </Box>
        <Box flexDirection="column">
          <Text dimColor>{'\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510'}</Text>
          <Text dimColor>{'\u2502'}  Light Mode           {'\u2502'}</Text>
          <Text dimColor>{'\u2502'}                         {'\u2502'}</Text>
          <Text dimColor>{'\u2502'} <Text color={lightColors.primary}>{'\u25A0'} primary  {lightColors.primary}</Text> {'\u2502'}</Text>
          <Text dimColor>{'\u2502'} <Text color={lightColors.success}>{'\u25A0'} success  {lightColors.success}</Text> {'\u2502'}</Text>
          <Text dimColor>{'\u2502'} <Text color={lightColors.error}>{'\u25A0'} error    {lightColors.error}</Text> {'\u2502'}</Text>
          <Text dimColor>{'\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518'}</Text>
        </Box>
      </Box>
    </Box>
  )
}

/* ── Layout Page ── */

function LayoutPage({ colors }: { colors: ReturnType<typeof useTheme> }) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>Horizontal Alignment</Text>
      </Box>

      <Box flexDirection="row" gap={1}>
        <Box flexDirection="column">
          <Text color={colors.info}>{'\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E'}</Text>
          <Text color={colors.info}>{'\u2502'}{'  '}top{'     '}{'\u2502'}</Text>
          <Text color={colors.info}>{'\u2502'}{'  '}aligned{'  '}{'\u2502'}</Text>
          <Text color={colors.info}>{'\u2502'}{'          '}{'\u2502'}</Text>
          <Text color={colors.info}>{'\u2502'}{'          '}{'\u2502'}</Text>
          <Text color={colors.info}>{'\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F'}</Text>
        </Box>
        <Box flexDirection="column">
          <Text color={colors.success}>{'\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E'}</Text>
          <Text color={colors.success}>{'\u2502'}{'          '}{'\u2502'}</Text>
          <Text color={colors.success}>{'\u2502'}{' '}center{'   '}{'\u2502'}</Text>
          <Text color={colors.success}>{'\u2502'}{' '}aligned{'  '}{'\u2502'}</Text>
          <Text color={colors.success}>{'\u2502'}{'          '}{'\u2502'}</Text>
          <Text color={colors.success}>{'\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F'}</Text>
        </Box>
        <Box flexDirection="column">
          <Text color={colors.warning}>{'\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E'}</Text>
          <Text color={colors.warning}>{'\u2502'}{'          '}{'\u2502'}</Text>
          <Text color={colors.warning}>{'\u2502'}{'          '}{'\u2502'}</Text>
          <Text color={colors.warning}>{'\u2502'}{'          '}{'\u2502'}</Text>
          <Text color={colors.warning}>{'\u2502'}{' '}bottom{'   '}{'\u2502'}</Text>
          <Text color={colors.warning}>{'\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F'}</Text>
        </Box>
      </Box>

      <Box marginTop={1} marginBottom={1}>
        <Text bold color={colors.primary}>Vertical Joining</Text>
      </Box>

      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column">
          <Text color={colors.primary}>{'\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E'}</Text>
          <Text color={colors.primary}>{'\u2502'}{'  '}Header{'          '}{'\u2502'}</Text>
          <Text color={colors.primary}>{'\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524'}</Text>
          <Text color={colors.primary}>{'\u2502'}{'  '}Body{'            '}{'\u2502'}</Text>
          <Text color={colors.primary}>{'\u2502'}{'  '}Content area{'    '}{'\u2502'}</Text>
          <Text color={colors.primary}>{'\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524'}</Text>
          <Text color={colors.primary}>{'\u2502'}{'  '}Footer{'          '}{'\u2502'}</Text>
          <Text color={colors.primary}>{'\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F'}</Text>
        </Box>

        <Box flexDirection="column">
          <Text color={colors.secondary}>{'\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510'}</Text>
          <Text color={colors.secondary}>{'\u2502'}{' '}Left{'   '}{'\u2502'}{' '}Right{'  '}{'\u2502'}</Text>
          <Text color={colors.secondary}>{'\u2502'}{' '}panel{'  '}{'\u2502'}{' '}panel{'  '}{'\u2502'}</Text>
          <Text color={colors.secondary}>{'\u2502'}{'        '}{'\u2502'}{'        '}{'\u2502'}</Text>
          <Text color={colors.secondary}>{'\u2502'}{'        '}{'\u2502'}{'        '}{'\u2502'}</Text>
          <Text color={colors.secondary}>{'\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518'}</Text>
        </Box>
      </Box>
    </Box>
  )
}

/* ── Main Component ── */

export function StyleSystem() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, { page: 'borders' as Page })
  const { page } = state

  useInput((ch, key) => {
    if (ch === '1') dispatch({ type: 'set_page', page: 'borders' })
    else if (ch === '2') dispatch({ type: 'set_page', page: 'text' })
    else if (ch === '3') dispatch({ type: 'set_page', page: 'colors' })
    else if (ch === '4') dispatch({ type: 'set_page', page: 'layout' })
    else if (key.tab) dispatch({ type: 'next_page' })
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Style System</Text>
        <Text dimColor>Lip Gloss-inspired styling DSL</Text>
      </Box>

      {/* Tab bar */}
      <Box marginBottom={1} gap={1}>
        {PAGES.map(p => (
          <Box key={p}>
            {p === page ? (
              <Text inverse bold>{' '}{PAGE_LABELS[p]}{' '}</Text>
            ) : (
              <Text dimColor>{' '}{PAGE_LABELS[p]}{' '}</Text>
            )}
          </Box>
        ))}
      </Box>

      {/* Page content */}
      {page === 'borders' && <BordersPage colors={colors} />}
      {page === 'text' && <TextPage colors={colors} />}
      {page === 'colors' && <ColorsPage colors={colors} />}
      {page === 'layout' && <LayoutPage colors={colors} />}

      {/* Footer */}
      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> tab </Text>
          <Text dimColor> next page</Text>
        </Box>
        <Box>
          <Text inverse bold> 1-4 </Text>
          <Text dimColor> jump to page</Text>
        </Box>
      </Box>
    </Box>
  )
}
