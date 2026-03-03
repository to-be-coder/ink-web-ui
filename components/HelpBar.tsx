import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// ── Types ────────────────────────────────────────────────────────────

interface Keybinding {
  key: string
  description: string
  group?: string
  disabled?: boolean
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

// ── Demo data ────────────────────────────────────────────────────────

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

const FILES_KEYBINDINGS: Keybinding[] = [
  { key: 'enter', description: 'open', group: 'Navigation' },
  { key: 'd', description: 'delete', group: 'Actions' },
  { key: '/', description: 'search', group: 'Navigation' },
  { key: 'n', description: 'new file', group: 'Actions' },
  { key: 'r', description: 'rename', group: 'Actions' },
]

const EDITOR_KEYBINDINGS: Keybinding[] = [
  { key: 'ctrl+s', description: 'save', group: 'File' },
  { key: 'ctrl+z', description: 'undo', group: 'Edit' },
  { key: 'ctrl+f', description: 'find', group: 'Edit' },
  { key: 'ctrl+g', description: 'goto line', group: 'Navigation' },
]

// ── Sub-components ───────────────────────────────────────────────────

function FilePanel({ files, cursor, focused }: { files: FileEntry[]; cursor: number; focused: boolean }) {
  const colors = useTheme()
  const borderChar = focused ? '║' : '│'
  const hChar = focused ? '═' : '─'
  const tl = focused ? '╔' : '┌'
  const tr = focused ? '╗' : '┐'
  const bl = focused ? '╚' : '└'
  const br = focused ? '╝' : '┘'
  const panelWidth = 22

  return (
    <Box flexDirection="column">
      <Text color={focused ? colors.primary : 'gray'}>
        {tl}{hChar} Files {hChar.repeat(panelWidth - 8)}{tr}
      </Text>
      {files.map((f, i) => {
        const isActive = i === cursor && focused
        const icon = f.type === 'folder' ? '/' : ' '
        const name = `${icon}${f.name}`
        const padded = name.padEnd(panelWidth)

        return (
          <Box key={f.name}>
            <Text color={focused ? colors.primary : 'gray'}>{borderChar}</Text>
            <Text
              color={isActive ? 'black' : f.type === 'folder' ? colors.info : undefined}
              backgroundColor={isActive ? colors.primary : undefined}
              bold={isActive || f.type === 'folder'}
            >
              {padded}
            </Text>
            <Text color={focused ? colors.primary : 'gray'}>{borderChar}</Text>
          </Box>
        )
      })}
      <Text color={focused ? colors.primary : 'gray'}>
        {bl}{hChar.repeat(panelWidth)}{br}
      </Text>
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
  const borderChar = focused ? '║' : '│'
  const hChar = focused ? '═' : '─'
  const tl = focused ? '╔' : '┌'
  const tr = focused ? '╗' : '┐'
  const bl = focused ? '╚' : '└'
  const br = focused ? '╝' : '┘'
  const contentWidth = 42

  const visibleLines = lines.slice(0, height)

  return (
    <Box flexDirection="column">
      <Text color={focused ? colors.primary : 'gray'}>
        {tl}{hChar} Editor {hChar.repeat(contentWidth - 9)}{tr}
      </Text>
      {visibleLines.map((line, i) => {
        const isActive = i === cursorLine && focused
        const lineNum = String(i + 1).padStart(2, ' ')
        const content = line.slice(0, contentWidth - 4)
        const padded = content.padEnd(contentWidth - 4)

        return (
          <Box key={i}>
            <Text color={focused ? colors.primary : 'gray'}>{borderChar}</Text>
            <Text dimColor>{lineNum} </Text>
            <Text
              color={isActive ? colors.primary : undefined}
              bold={isActive}
            >
              {padded}
            </Text>
            <Text color={focused ? colors.primary : 'gray'}> {borderChar}</Text>
          </Box>
        )
      })}
      <Text color={focused ? colors.primary : 'gray'}>
        {bl}{hChar.repeat(contentWidth)}{br}
      </Text>
    </Box>
  )
}

function HelpBarShort({ bindings }: { bindings: Keybinding[] }) {
  const colors = useTheme()
  const active = bindings.filter(b => !b.disabled)

  return (
    <Box gap={0}>
      {active.map((b, i) => (
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

function HelpBarFull({ bindings, panelLabel }: { bindings: Keybinding[]; panelLabel: string }) {
  const colors = useTheme()
  const active = bindings.filter(b => !b.disabled)

  // Group by group name
  const groups: Record<string, Keybinding[]> = {}
  for (const b of active) {
    const g = b.group ?? 'General'
    if (!groups[g]) groups[g] = []
    groups[g]!.push(b)
  }

  const groupEntries = Object.entries(groups)

  return (
    <Box flexDirection="column">
      <Box marginBottom={0} gap={1}>
        <Text bold color={colors.primary}>Keybindings</Text>
        <Text dimColor>({panelLabel} panel)</Text>
        <Box flexGrow={1} />
        <Text bold color={colors.primary}>?</Text>
        <Text dimColor> close</Text>
      </Box>
      <Box gap={4}>
        {groupEntries.map(([group, items]) => (
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

// ── Main component ───────────────────────────────────────────────────

export function HelpBar() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    focusedPanel: 'files' as PanelId,
    helpExpanded: false,
    fileCursor: 0,
    editorCursorLine: 0,
  })

  const { focusedPanel, helpExpanded, fileCursor, editorCursorLine } = state

  const currentBindings = focusedPanel === 'files' ? FILES_KEYBINDINGS : EDITOR_KEYBINDINGS
  const panelLabel = focusedPanel === 'files' ? 'Files' : 'Editor'

  useInput((ch, key) => {
    // Global: toggle help
    if (ch === '?') {
      dispatch({ type: 'toggle_help' })
      return
    }

    // Global: switch panel
    if (key.tab) {
      dispatch({ type: 'switch_panel' })
      return
    }

    // Panel-specific navigation
    if (focusedPanel === 'files') {
      if (key.upArrow || ch === 'k') dispatch({ type: 'file_up' })
      else if (key.downArrow || ch === 'j') dispatch({ type: 'file_down', max: FILES.length })
    } else {
      if (key.upArrow || ch === 'k') dispatch({ type: 'editor_up' })
      else if (key.downArrow || ch === 'j') dispatch({ type: 'editor_down', max: EDITOR_LINES.length })
    }
  })

  const editorHeight = FILES.length

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
        <EditorPanel lines={EDITOR_LINES} cursorLine={editorCursorLine} focused={focusedPanel === 'editor'} height={editorHeight} />
      </Box>

      {/* Separator */}
      <Text dimColor>{'─'.repeat(67)}</Text>

      {/* Help bar */}
      {helpExpanded ? (
        <HelpBarFull bindings={currentBindings} panelLabel={panelLabel} />
      ) : (
        <HelpBarShort bindings={currentBindings} />
      )}
    </Box>
  )
}
