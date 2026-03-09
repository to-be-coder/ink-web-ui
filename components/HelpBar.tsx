import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

interface Keybinding {
  key: string
  description: string
  group: string
}

type PanelId = 'files' | 'editor'

interface FileEntry {
  name: string
  type: 'file' | 'folder'
}

interface State {
  focusedPanel: PanelId
  helpExpanded: boolean
  fileCursor: number
  editorCursorLine: number
}

type Action =
  | { type: 'switch_panel' }
  | { type: 'toggle_help' }
  | { type: 'file_up' }
  | { type: 'file_down'; max: number }
  | { type: 'editor_up' }
  | { type: 'editor_down'; max: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'switch_panel':
      return { ...state, focusedPanel: state.focusedPanel === 'files' ? 'editor' : 'files' }
    case 'toggle_help':
      return { ...state, helpExpanded: !state.helpExpanded }
    case 'file_up':
      return { ...state, fileCursor: Math.max(0, state.fileCursor - 1) }
    case 'file_down':
      return { ...state, fileCursor: Math.min(action.max - 1, state.fileCursor + 1) }
    case 'editor_up':
      return { ...state, editorCursorLine: Math.max(0, state.editorCursorLine - 1) }
    case 'editor_down':
      return { ...state, editorCursorLine: Math.min(action.max - 1, state.editorCursorLine + 1) }
  }
}

/* ── Demo data ── */

const FILES: FileEntry[] = [
  { name: 'src/', type: 'folder' },
  { name: 'tests/', type: 'folder' },
  { name: 'index.ts', type: 'file' },
  { name: 'App.tsx', type: 'file' },
  { name: 'utils.ts', type: 'file' },
  { name: 'types.ts', type: 'file' },
  { name: 'config.ts', type: 'file' },
  { name: 'router.ts', type: 'file' },
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
]

const EDITOR_LINES = [
  'import { useState } from "react";',
  'import { render } from "ink";',
  '',
  'interface AppProps {',
  '  name: string;',
  '  debug?: boolean;',
  '}',
  '',
  'export function App({ name }: AppProps) {',
  '  const [count, setCount] = useState(0);',
  '',
  '  return (',
  '    <Box flexDirection="column">',
  '      <Text bold>{name}</Text>',
  '      <Text>Count: {count}</Text>',
  '    </Box>',
  '  );',
  '}',
]

const FILE_BINDINGS: Keybinding[] = [
  { key: 'enter', description: 'open', group: 'Navigation' },
  { key: '/', description: 'search', group: 'Navigation' },
  { key: 'n', description: 'new file', group: 'Actions' },
  { key: 'r', description: 'rename', group: 'Actions' },
  { key: 'd', description: 'delete', group: 'Actions' },
]

const EDITOR_BINDINGS: Keybinding[] = [
  { key: 'ctrl+s', description: 'save', group: 'File' },
  { key: 'ctrl+z', description: 'undo', group: 'Edit' },
  { key: 'ctrl+f', description: 'find', group: 'Edit' },
  { key: 'ctrl+g', description: 'goto line', group: 'Navigation' },
]

/* ── Sub-components ── */

function FilePanel({ files, cursor, focused }: { files: FileEntry[]; cursor: number; focused: boolean }) {
  const colors = useTheme()

  return (
    <Box
      flexDirection="column"
      borderStyle={focused ? 'double' : 'single'}
      borderColor={focused ? colors.primary : 'gray'}
      flexBasis={24}
      flexShrink={1}
      overflow="hidden"
    >
      <Text bold color={focused ? colors.primary : 'gray'}>Files</Text>
      {files.map((f, i) => {
        const isActive = i === cursor && focused
        const icon = f.type === 'folder' ? '/' : ' '
        const name = `${icon}${f.name}`

        return (
          <Text
            key={f.name}
            wrap="truncate-end"
            color={isActive ? 'black' : f.type === 'folder' ? colors.info : undefined}
            backgroundColor={isActive ? colors.primary : undefined}
            bold={isActive || f.type === 'folder'}
          >
            {name}
          </Text>
        )
      })}
    </Box>
  )
}

function EditorPanel({
  lines,
  cursorLine,
  focused,
  height,
}: {
  lines: string[]
  cursorLine: number
  focused: boolean
  height: number
}) {
  const colors = useTheme()
  const visibleLines = lines.slice(0, height)

  return (
    <Box
      flexDirection="column"
      borderStyle={focused ? 'double' : 'single'}
      borderColor={focused ? colors.primary : 'gray'}
      flexGrow={1}
      overflow="hidden"
    >
      <Text bold color={focused ? colors.primary : 'gray'}>Editor</Text>
      {visibleLines.map((line, i) => {
        const isActive = i === cursorLine && focused
        const num = String(i + 1).padStart(2, ' ')

        return (
          <Text key={i} wrap="truncate-end">
            <Text dimColor>{num} </Text>
            <Text color={isActive ? colors.primary : undefined} bold={isActive}>
              {line}
            </Text>
          </Text>
        )
      })}
    </Box>
  )
}

function ShortHelp({ bindings }: { bindings: Keybinding[] }) {
  const colors = useTheme()
  return (
    <Box gap={0}>
      {bindings.map((b, i) => (
        <Box key={b.key} gap={0}>
          {i > 0 && <Text dimColor> {'\u2022'} </Text>}
          <Text bold color={colors.primary}>{b.key}</Text>
          <Text dimColor> {b.description}</Text>
        </Box>
      ))}
      <Text dimColor> {'\u2022'} </Text>
      <Text bold color={colors.primary}>?</Text>
      <Text dimColor> help</Text>
    </Box>
  )
}

function FullHelp({ bindings, label }: { bindings: Keybinding[]; label: string }) {
  const colors = useTheme()

  const groups: Record<string, Keybinding[]> = {}
  for (const b of bindings) {
    if (!groups[b.group]) groups[b.group] = []
    groups[b.group]!.push(b)
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={0} gap={1}>
        <Text bold color={colors.primary}>Keybindings</Text>
        <Text dimColor>({label} panel)</Text>
        <Box flexGrow={1} />
        <Text bold color={colors.primary}>?</Text>
        <Text dimColor> close</Text>
      </Box>
      <Box gap={4}>
        {Object.entries(groups).map(([group, items]) => (
          <Box key={group} flexDirection="column">
            <Text bold color={colors.secondary}>{group}</Text>
            {items.map(b => (
              <Box key={b.key} gap={1}>
                <Box width={8}>
                  <Text bold color={colors.primary}>{b.key.padEnd(8)}</Text>
                </Box>
                <Text dimColor>{b.description}</Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

/* ── Main ── */

export function HelpBar() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    focusedPanel: 'files' as PanelId,
    helpExpanded: false,
    fileCursor: 0,
    editorCursorLine: 0,
  })

  const { focusedPanel, helpExpanded, fileCursor, editorCursorLine } = state
  const bindings = focusedPanel === 'files' ? FILE_BINDINGS : EDITOR_BINDINGS
  const panelLabel = focusedPanel === 'files' ? 'Files' : 'Editor'

  useInput((ch, key) => {
    if (ch === '?') { dispatch({ type: 'toggle_help' }); return }
    if (key.tab) { dispatch({ type: 'switch_panel' }); return }

    if (focusedPanel === 'files') {
      if (key.upArrow || ch === 'k') dispatch({ type: 'file_up' })
      else if (key.downArrow || ch === 'j') dispatch({ type: 'file_down', max: FILES.length })
    } else {
      if (key.upArrow || ch === 'k') dispatch({ type: 'editor_up' })
      else if (key.downArrow || ch === 'j') dispatch({ type: 'editor_down', max: EDITOR_LINES.length })
    }
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={0} gap={2}>
        <Text bold color={colors.primary}>Help Bar Demo</Text>
        <Text dimColor>Focus:</Text>
        <Text color={colors.info} bold>{panelLabel}</Text>
        <Text dimColor>(tab to switch)</Text>
      </Box>

      {/* Panels */}
      <Box gap={1}>
        <FilePanel files={FILES} cursor={fileCursor} focused={focusedPanel === 'files'} />
        <EditorPanel lines={EDITOR_LINES} cursorLine={editorCursorLine} focused={focusedPanel === 'editor'} height={FILES.length} />
      </Box>

      {/* Help bar */}
      {helpExpanded ? (
        <FullHelp bindings={bindings} label={panelLabel} />
      ) : (
        <ShortHelp bindings={bindings} />
      )}
    </Box>
  )
}
