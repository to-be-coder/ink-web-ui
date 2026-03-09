import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// --- Types (matching bubbles/filepicker) ---

interface FileEntry {
  name: string
  isDir: boolean
  size: number // bytes
  permissions: string
  hidden: boolean
  children?: FileEntry[]
}

// --- Demo file tree ---

function dir(name: string, children: FileEntry[], hidden = false): FileEntry {
  return { name, isDir: true, size: 0, permissions: 'drwxr-xr-x', hidden, children }
}

function file(name: string, size: number, hidden = false): FileEntry {
  return { name, isDir: false, size, permissions: '-rw-r--r--', hidden }
}

const FILE_TREE: FileEntry = dir('~', [
  dir('.config', [
    dir('nvim', [file('init.lua', 4200), file('lazy-lock.json', 12400)], false),
    file('starship.toml', 890),
  ], true),
  dir('.ssh', [file('id_ed25519', 464, true), file('id_ed25519.pub', 100), file('known_hosts', 2300)], true),
  dir('projects', [
    dir('ink-web-ui', [
      dir('components', [
        file('Spinner.tsx', 3200),
        file('TextInput.tsx', 8400),
        file('Progress.tsx', 5600),
        file('Viewport.tsx', 4100),
      ]),
      dir('content', [file('meta.json', 420)]),
      file('package.json', 827),
      file('tsconfig.json', 737),
      file('README.md', 878),
    ]),
    dir('api-server', [
      dir('src', [file('main.go', 2100), file('handler.go', 5800), file('middleware.go', 3200)]),
      file('go.mod', 340),
      file('Dockerfile', 520),
    ]),
  ]),
  dir('documents', [
    file('notes.md', 14200),
    file('todo.txt', 380),
    file('budget.csv', 24600),
  ]),
  file('.zshrc', 2400, true),
  file('.gitconfig', 340, true),
])

// --- Helpers ---

function humanSize(bytes: number): string {
  if (bytes === 0) return '   -'
  if (bytes < 1024) return `${String(bytes).padStart(3, ' ')} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).padStart(3, ' ')} K`
  return `${(bytes / (1024 * 1024)).toFixed(1).padStart(3, ' ')} M`
}

function getVisibleEntries(dir: FileEntry, showHidden: boolean): FileEntry[] {
  if (!dir.children) return []
  const entries = showHidden
    ? dir.children
    : dir.children.filter((e) => !e.hidden)
  // Directories first, then files, alphabetical within each
  return [
    ...entries.filter((e) => e.isDir).sort((a, b) => a.name.localeCompare(b.name)),
    ...entries.filter((e) => !e.isDir).sort((a, b) => a.name.localeCompare(b.name)),
  ]
}

// --- State ---

interface State {
  path: FileEntry[] // stack of directories from root to current
  cursor: number
  showHidden: boolean
  selectedFile: string | null
  allowedExtensions: string[] // empty = all
}

type Action =
  | { type: 'cursor_up' }
  | { type: 'cursor_down'; max: number }
  | { type: 'enter_dir'; entry: FileEntry }
  | { type: 'go_up' }
  | { type: 'toggle_hidden' }
  | { type: 'select_file'; name: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'cursor_up':
      return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'cursor_down':
      return { ...state, cursor: Math.min(action.max - 1, state.cursor + 1) }
    case 'enter_dir':
      return { ...state, path: [...state.path, action.entry], cursor: 0, selectedFile: null }
    case 'go_up':
      if (state.path.length <= 1) return state
      return { ...state, path: state.path.slice(0, -1), cursor: 0, selectedFile: null }
    case 'toggle_hidden':
      return { ...state, showHidden: !state.showHidden, cursor: 0 }
    case 'select_file':
      return { ...state, selectedFile: action.name }
  }
}

// --- Component ---

const VIEWPORT_HEIGHT = 14

export function FilePicker() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    path: [FILE_TREE],
    cursor: 0,
    showHidden: false,
    selectedFile: null,
    allowedExtensions: [],
  })

  const { path, cursor, showHidden, selectedFile } = state
  const currentDir = path[path.length - 1]
  const entries = getVisibleEntries(currentDir, showHidden)
  const total = entries.length

  // Viewport scrolling
  let scrollOff = 0
  if (cursor >= VIEWPORT_HEIGHT) {
    scrollOff = Math.min(cursor - VIEWPORT_HEIGHT + 1, Math.max(0, total - VIEWPORT_HEIGHT))
  }
  const visibleEntries = entries.slice(scrollOff, scrollOff + VIEWPORT_HEIGHT)

  // Breadcrumb path
  const breadcrumb = path.map((d) => d.name).join('/')

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') {
      dispatch({ type: 'cursor_up' })
    } else if (key.downArrow || ch === 'j') {
      dispatch({ type: 'cursor_down', max: total })
    } else if (key.return || key.rightArrow) {
      const entry = entries[cursor]
      if (entry?.isDir) {
        dispatch({ type: 'enter_dir', entry })
      } else if (entry) {
        dispatch({ type: 'select_file', name: `${breadcrumb}/${entry.name}` })
      }
    } else if (key.leftArrow || key.backspace) {
      dispatch({ type: 'go_up' })
    } else if (ch === '.') {
      dispatch({ type: 'toggle_hidden' })
    }
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={0} gap={2}>
        <Text bold color={colors.primary}>FilePicker</Text>
        <Text dimColor>{total} entries</Text>
        {showHidden && <Text color={colors.secondary}>+hidden</Text>}
      </Box>

      {/* Breadcrumb */}
      <Box>
        <Text color={colors.info}>{breadcrumb}/</Text>
      </Box>

      <Box><Text dimColor>{'─'.repeat(55)}</Text></Box>

      {/* Back link */}
      {path.length > 1 && (
        <Box gap={1}>
          <Text color="gray"> </Text>
          <Text dimColor>📁</Text>
          <Text color={colors.info}>..</Text>
        </Box>
      )}

      {/* File list */}
      <Box flexDirection="column">
        {total === 0 ? (
          <Text dimColor>  (empty directory)</Text>
        ) : (
          visibleEntries.map((entry, vi) => {
            const globalIdx = scrollOff + vi
            const isActive = globalIdx === cursor
            const icon = entry.isDir ? '📁' : '📄'

            return (
              <Box key={entry.name} gap={1}>
                <Text color={isActive ? colors.primary : 'gray'}>
                  {isActive ? '▸' : ' '}
                </Text>
                <Text>{icon}</Text>
                <Box width={22}>
                  <Text
                    color={
                      isActive
                        ? 'white'
                        : entry.isDir
                          ? colors.info
                          : entry.hidden
                            ? 'gray'
                            : undefined
                    }
                    bold={isActive || entry.isDir}
                  >
                    {entry.name}{entry.isDir ? '/' : ''}
                  </Text>
                </Box>
                <Box width={7}>
                  <Text dimColor>{humanSize(entry.size)}</Text>
                </Box>
                <Text dimColor>{entry.permissions}</Text>
              </Box>
            )
          })
        )}
      </Box>

      <Box><Text dimColor>{'─'.repeat(55)}</Text></Box>

      {/* Selected file */}
      {selectedFile && (
        <Box>
          <Text color={colors.success}>Selected: </Text>
          <Text>{selectedFile}</Text>
        </Box>
      )}

      {/* Help */}
      <Box marginTop={selectedFile ? 0 : 0} gap={2}>
        <Box><Text inverse bold> ↑↓ </Text><Text dimColor> nav</Text></Box>
        <Box><Text inverse bold> enter </Text><Text dimColor> open/select</Text></Box>
        <Box><Text inverse bold> ← </Text><Text dimColor> parent</Text></Box>
        <Box><Text inverse bold> . </Text><Text dimColor> hidden</Text></Box>
      </Box>
    </Box>
  )
}
