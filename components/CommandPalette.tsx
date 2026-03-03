import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

/* ────────────────────── Types ────────────────────── */

interface Command {
  id: string
  label: string
  category: 'File' | 'Edit' | 'View' | 'Git' | 'AI'
  shortcut?: string
}

interface State {
  open: boolean
  query: string
  cursor: number
  recentIds: string[]
  flashMessage: string | null
  flashTimer: number
}

type Action =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'type_char'; char: string }
  | { type: 'backspace' }
  | { type: 'move_up' }
  | { type: 'move_down'; max: number }
  | { type: 'execute'; cmd: Command }
  | { type: 'clear_flash' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'open':
      return { ...state, open: true, query: '', cursor: 0, flashMessage: null }
    case 'close':
      return { ...state, open: false, query: '', flashMessage: null }
    case 'type_char':
      return { ...state, query: state.query + action.char, cursor: 0 }
    case 'backspace':
      return { ...state, query: state.query.slice(0, -1), cursor: 0 }
    case 'move_up':
      return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'move_down':
      return { ...state, cursor: Math.min(action.max - 1, state.cursor + 1) }
    case 'execute': {
      const newRecent = [action.cmd.id, ...state.recentIds.filter(id => id !== action.cmd.id)].slice(0, 10)
      return {
        ...state,
        open: false,
        query: '',
        recentIds: newRecent,
        flashMessage: `Executed: ${action.cmd.label}`,
        flashTimer: state.flashTimer + 1,
      }
    }
    case 'clear_flash':
      return { ...state, flashMessage: null }
  }
}

/* ────────────────────── Commands (25 across 5 categories) ────────────────────── */

const COMMANDS: Command[] = [
  // File
  { id: 'file-new',      label: 'New File',      category: 'File', shortcut: 'ctrl+n' },
  { id: 'file-open',     label: 'Open File',     category: 'File', shortcut: 'ctrl+o' },
  { id: 'file-save',     label: 'Save',          category: 'File', shortcut: 'ctrl+s' },
  { id: 'file-save-all', label: 'Save All',      category: 'File', shortcut: 'ctrl+shift+s' },
  { id: 'file-close',    label: 'Close File',    category: 'File', shortcut: 'ctrl+w' },
  // Edit
  { id: 'edit-undo',     label: 'Undo',          category: 'Edit', shortcut: 'ctrl+z' },
  { id: 'edit-redo',     label: 'Redo',          category: 'Edit', shortcut: 'ctrl+y' },
  { id: 'edit-cut',      label: 'Cut',           category: 'Edit', shortcut: 'ctrl+x' },
  { id: 'edit-copy',     label: 'Copy',          category: 'Edit', shortcut: 'ctrl+c' },
  { id: 'edit-paste',    label: 'Paste',         category: 'Edit', shortcut: 'ctrl+v' },
  { id: 'edit-find',     label: 'Find',          category: 'Edit', shortcut: 'ctrl+f' },
  { id: 'edit-replace',  label: 'Replace',       category: 'Edit', shortcut: 'ctrl+h' },
  // View
  { id: 'view-sidebar',  label: 'Toggle Sidebar',  category: 'View', shortcut: 'ctrl+b' },
  { id: 'view-terminal', label: 'Toggle Terminal',  category: 'View', shortcut: 'ctrl+`' },
  { id: 'view-zoom-in',  label: 'Zoom In',         category: 'View', shortcut: 'ctrl+=' },
  { id: 'view-zoom-out', label: 'Zoom Out',        category: 'View', shortcut: 'ctrl+-' },
  { id: 'view-fullscr',  label: 'Full Screen',     category: 'View' },
  // Git
  { id: 'git-commit',    label: 'Commit',        category: 'Git', shortcut: 'ctrl+shift+g' },
  { id: 'git-push',      label: 'Push',          category: 'Git' },
  { id: 'git-pull',      label: 'Pull',          category: 'Git' },
  { id: 'git-branch',    label: 'Create Branch', category: 'Git' },
  { id: 'git-stash',     label: 'Stash',         category: 'Git' },
  // AI
  { id: 'ai-ask',        label: 'Ask AI',        category: 'AI' },
  { id: 'ai-generate',   label: 'Generate Code', category: 'AI' },
  { id: 'ai-explain',    label: 'Explain Code',  category: 'AI' },
  { id: 'ai-fix',        label: 'Fix Error',     category: 'AI' },
  { id: 'ai-refactor',   label: 'Refactor',      category: 'AI' },
]

const CATEGORIES: Command['category'][] = ['File', 'Edit', 'View', 'Git', 'AI']

/* ────────────────────── Fuzzy search ────────────────────── */

function fuzzyMatch(query: string, text: string): { match: boolean; score: number; indices: number[] } {
  if (!query) return { match: true, score: 0, indices: [] }
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const indices: number[] = []
  let qi = 0

  for (let i = 0; i < lower.length && qi < qLower.length; i++) {
    if (lower[i] === qLower[qi]) {
      indices.push(i)
      qi++
    }
  }

  if (qi < qLower.length) return { match: false, score: 0, indices: [] }

  let score = 100
  for (let k = 1; k < indices.length; k++) {
    if (indices[k]! - indices[k - 1]! === 1) score += 10
  }
  score -= indices[0]! * 2
  return { match: true, score, indices }
}

/* ────────────────────── Highlighted text ────────────────────── */

function HighlightedText({ text, indices, baseColor }: { text: string; indices: number[]; baseColor?: string }) {
  const colors = useTheme()
  const idxSet = new Set(indices)
  const parts: React.ReactNode[] = []
  let i = 0

  while (i < text.length) {
    if (idxSet.has(i)) {
      let end = i
      while (end < text.length && idxSet.has(end)) end++
      parts.push(<Text key={i} color={colors.warning} bold>{text.slice(i, end)}</Text>)
      i = end
    } else {
      let end = i
      while (end < text.length && !idxSet.has(end)) end++
      parts.push(<Text key={i} color={baseColor}>{text.slice(i, end)}</Text>)
      i = end
    }
  }

  return <>{parts}</>
}

/* ────────────────────── Category badge colors ────────────────────── */

function useCategoryColors() {
  const colors = useTheme()
  return {
    File: colors.info,
    Edit: colors.success,
    View: colors.secondary,
    Git: colors.warning,
    AI: colors.primary,
  } as Record<string, string>
}

/* ────────────────────── Mock editor lines ────────────────────── */

const EDITOR_LINES = [
  'import { useState, useEffect } from "react";',
  'import { createServer } from "http";',
  '',
  'const PORT = process.env.PORT || 3000;',
  '',
  'interface Config {',
  '  host: string;',
  '  port: number;',
  '  debug: boolean;',
  '}',
  '',
  'function loadConfig(): Config {',
  '  return {',
  '    host: "0.0.0.0",',
  '    port: PORT,',
  '    debug: true,',
  '  };',
  '}',
  '',
  'const server = createServer((req, res) => {',
  '  res.writeHead(200);',
  '  res.end("OK");',
  '});',
]

const VISIBLE_RESULTS = 8
const PALETTE_WIDTH = 50

/* ────────────────────── Component ────────────────────── */

export function CommandPalette() {
  const colors = useTheme()
  const catColors = useCategoryColors()

  const [state, dispatch] = useReducer(reducer, {
    open: false,
    query: '',
    cursor: 0,
    recentIds: [],
    flashMessage: null,
    flashTimer: 0,
  })

  const { open, query, cursor, recentIds, flashMessage } = state

  /* ── Build filtered + scored results ── */
  const scored = COMMANDS.map(cmd => {
    const m = fuzzyMatch(query, cmd.label)
    return { cmd, ...m }
  }).filter(r => r.match)

  /* ── Sort: recent first, then by score ── */
  scored.sort((a, b) => {
    const aRecent = recentIds.indexOf(a.cmd.id)
    const bRecent = recentIds.indexOf(b.cmd.id)
    const aIsRecent = aRecent !== -1
    const bIsRecent = bRecent !== -1
    if (aIsRecent && !bIsRecent) return -1
    if (!aIsRecent && bIsRecent) return 1
    if (aIsRecent && bIsRecent) return aRecent - bRecent
    return b.score - a.score
  })

  const flat = scored

  /* ── Input ── */
  useInput((ch, key) => {
    if (!open) {
      if (key.ctrl && ch === 'k') dispatch({ type: 'open' })
      else if (flashMessage && ch) dispatch({ type: 'clear_flash' })
      return
    }

    if (key.escape) dispatch({ type: 'close' })
    else if (key.return) {
      const item = flat[cursor]
      if (item) dispatch({ type: 'execute', cmd: item.cmd })
    }
    else if (key.upArrow) dispatch({ type: 'move_up' })
    else if (key.downArrow) dispatch({ type: 'move_down', max: flat.length })
    else if (key.backspace || key.delete) dispatch({ type: 'backspace' })
    else if (ch && !key.ctrl && !key.meta) dispatch({ type: 'type_char', char: ch })
  })

  /* ────── CLOSED STATE ────── */
  if (!open) {
    return (
      <Box flexDirection="column" paddingX={1}>
        {/* Mock editor */}
        {EDITOR_LINES.map((line, i) => (
          <Box key={i}>
            <Text color="gray">{String(i + 1).padStart(3)} </Text>
            <Text dimColor>{line}</Text>
          </Box>
        ))}

        {/* Flash message */}
        {flashMessage && (
          <Box marginTop={1}>
            <Text color={colors.success} bold>{flashMessage}</Text>
          </Box>
        )}

        {/* Hint */}
        <Box marginTop={flashMessage ? 0 : 1}>
          <Text dimColor>Press </Text>
          <Text bold color="white">ctrl+k</Text>
          <Text dimColor> to open command palette</Text>
        </Box>
      </Box>
    )
  }

  /* ────── OPEN STATE ────── */

  /* Scroll visible window */
  const maxVis = Math.min(VISIBLE_RESULTS, flat.length)
  let scrollOff = 0
  if (cursor >= scrollOff + maxVis) scrollOff = cursor - maxVis + 1
  if (cursor < scrollOff) scrollOff = cursor
  scrollOff = Math.max(0, Math.min(scrollOff, flat.length - maxVis))
  const visibleResults = flat.slice(scrollOff, scrollOff + maxVis)

  /* Group by category for display when query is empty */
  const showGrouped = !query
  let groupedEntries: { type: 'header' | 'item'; category?: string; item?: typeof flat[0]; flatIndex?: number }[] = []

  if (showGrouped) {
    let flatIdx = 0
    for (const cat of CATEGORIES) {
      const items = flat.filter(r => r.cmd.category === cat)
      if (items.length === 0) continue
      groupedEntries.push({ type: 'header', category: cat })
      for (const item of items) {
        const idx = flat.indexOf(item)
        groupedEntries.push({ type: 'item', item, flatIndex: idx })
        flatIdx++
      }
    }
  }

  /* Border building helpers */
  const topBorder = '\u256D' + '\u2500'.repeat(PALETTE_WIDTH - 2) + '\u256E'
  const botBorder = '\u2570' + '\u2500'.repeat(PALETTE_WIDTH - 2) + '\u256F'
  const sidePad = (content: string, totalWidth: number) => {
    const len = content.length
    const right = Math.max(0, totalWidth - 2 - len)
    return '\u2502' + content + ' '.repeat(right) + '\u2502'
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Dimmed editor background (partial) */}
      {EDITOR_LINES.slice(0, 4).map((line, i) => (
        <Box key={i}>
          <Text color="#444444">{String(i + 1).padStart(3)} {line}</Text>
        </Box>
      ))}

      {/* Palette modal */}
      <Box flexDirection="column" alignItems="center" marginTop={1}>
        {/* Top border */}
        <Text color={colors.primary}>{topBorder}</Text>

        {/* Search input */}
        <Box>
          <Text color={colors.primary}>{'\u2502'}</Text>
          <Text color={colors.primary}> {'>'} </Text>
          <Text>{query}</Text>
          <Text color="gray">_</Text>
          <Text>{' '.repeat(Math.max(0, PALETTE_WIDTH - 6 - query.length))}</Text>
          <Text color={colors.primary}>{'\u2502'}</Text>
        </Box>

        {/* Separator */}
        <Text color={colors.primary}>{'\u251C' + '\u2500'.repeat(PALETTE_WIDTH - 2) + '\u2524'}</Text>

        {/* Results */}
        {showGrouped ? (
          /* Grouped by category view */
          <Box flexDirection="column">
            {(() => {
              const rendered: React.ReactNode[] = []
              let itemCount = 0
              for (const entry of groupedEntries) {
                if (itemCount >= VISIBLE_RESULTS) break
                if (entry.type === 'header') {
                  rendered.push(
                    <Box key={`hdr-${entry.category}`}>
                      <Text color={colors.primary}>{'\u2502'}</Text>
                      <Text dimColor> {'\u2500\u2500'} </Text>
                      <Text color={catColors[entry.category!]} bold>{entry.category}</Text>
                      <Text>{' '.repeat(Math.max(0, PALETTE_WIDTH - 7 - (entry.category?.length ?? 0)))}</Text>
                      <Text color={colors.primary}>{'\u2502'}</Text>
                    </Box>
                  )
                } else if (entry.item) {
                  const idx = entry.flatIndex!
                  const isActive = idx === cursor
                  const cmd = entry.item.cmd
                  const pointer = isActive ? '\u276F' : ' '
                  const labelText = cmd.label
                  const shortcut = cmd.shortcut ?? ''
                  const labelWidth = PALETTE_WIDTH - 12 - shortcut.length
                  const paddedLabel = labelText.length > labelWidth ? labelText.slice(0, labelWidth) : labelText + ' '.repeat(Math.max(0, labelWidth - labelText.length))
                  const paddedShortcut = shortcut ? shortcut : ' '.repeat(0)

                  rendered.push(
                    <Box key={cmd.id}>
                      <Text color={colors.primary}>{'\u2502'}</Text>
                      <Text color={isActive ? colors.primary : undefined}> {pointer} </Text>
                      <Text color={catColors[cmd.category]} backgroundColor={isActive ? '#333333' : undefined}>
                        {cmd.category.padEnd(5)}
                      </Text>
                      <Text color={isActive ? 'white' : undefined} backgroundColor={isActive ? '#333333' : undefined} bold={isActive}>
                        {' '}{paddedLabel}
                      </Text>
                      {shortcut && <Text dimColor> {paddedShortcut}</Text>}
                      <Text color={colors.primary}>{'\u2502'}</Text>
                    </Box>
                  )
                  itemCount++
                }
              }
              return rendered
            })()}
          </Box>
        ) : (
          /* Filtered results view */
          <Box flexDirection="column">
            {visibleResults.map((r, vi) => {
              const idx = scrollOff + vi
              const isActive = idx === cursor
              const cmd = r.cmd
              const pointer = isActive ? '\u276F' : ' '
              const shortcut = cmd.shortcut ?? ''
              const labelWidth = PALETTE_WIDTH - 12 - shortcut.length
              const paddedShortcut = shortcut ? shortcut : ''

              return (
                <Box key={cmd.id}>
                  <Text color={colors.primary}>{'\u2502'}</Text>
                  <Text color={isActive ? colors.primary : undefined}> {pointer} </Text>
                  <Text color={catColors[cmd.category]} backgroundColor={isActive ? '#333333' : undefined}>
                    {cmd.category.padEnd(5)}
                  </Text>
                  <Box width={labelWidth + 1}>
                    <Text backgroundColor={isActive ? '#333333' : undefined}>
                      {' '}
                      <HighlightedText text={cmd.label} indices={r.indices} baseColor={isActive ? 'white' : undefined} />
                    </Text>
                  </Box>
                  {paddedShortcut ? <Text dimColor> {paddedShortcut}</Text> : null}
                  <Text color={colors.primary}>{'\u2502'}</Text>
                </Box>
              )
            })}
          </Box>
        )}

        {/* No results */}
        {flat.length === 0 && (
          <Box>
            <Text color={colors.primary}>{'\u2502'}</Text>
            <Text dimColor>  No matching commands</Text>
            <Text>{' '.repeat(Math.max(0, PALETTE_WIDTH - 25))}</Text>
            <Text color={colors.primary}>{'\u2502'}</Text>
          </Box>
        )}

        {/* Bottom separator */}
        <Text color={colors.primary}>{'\u251C' + '\u2500'.repeat(PALETTE_WIDTH - 2) + '\u2524'}</Text>

        {/* Result count */}
        <Box>
          <Text color={colors.primary}>{'\u2502'}</Text>
          <Text dimColor> {flat.length} command{flat.length !== 1 ? 's' : ''}</Text>
          <Text>{' '.repeat(Math.max(0, PALETTE_WIDTH - 4 - String(flat.length).length - (flat.length !== 1 ? 8 : 7)))}</Text>
          <Text color={colors.primary}>{'\u2502'}</Text>
        </Box>

        {/* Bottom border */}
        <Text color={colors.primary}>{botBorder}</Text>
      </Box>

      {/* Help */}
      <Box marginTop={1} paddingX={1} gap={2}>
        <Box>
          <Text inverse bold> {'\u2191\u2193'} </Text>
          <Text dimColor> navigate</Text>
        </Box>
        <Box>
          <Text inverse bold> enter </Text>
          <Text dimColor> execute</Text>
        </Box>
        <Box>
          <Text inverse bold> esc </Text>
          <Text dimColor> close</Text>
        </Box>
      </Box>
    </Box>
  )
}
