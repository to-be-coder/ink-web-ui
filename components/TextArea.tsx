import { useReducer, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// --- Constants ---

const VIEW_HEIGHT = 16
const MAX_LINES = 200

// --- State ---

interface State {
  lines: string[]
  cursorRow: number
  cursorCol: number
  scrollY: number
  cursorVisible: boolean
  charCount: number
}

type Action =
  | { type: 'insert_char'; char: string }
  | { type: 'insert_newline' }
  | { type: 'delete_back' }
  | { type: 'delete_forward' }
  | { type: 'delete_word_back' }
  | { type: 'delete_line' }
  | { type: 'cursor_up' }
  | { type: 'cursor_down' }
  | { type: 'cursor_left' }
  | { type: 'cursor_right' }
  | { type: 'cursor_home' }
  | { type: 'cursor_end' }
  | { type: 'cursor_word_left' }
  | { type: 'cursor_word_right' }
  | { type: 'page_up' }
  | { type: 'page_down' }
  | { type: 'goto_top' }
  | { type: 'goto_bottom' }
  | { type: 'toggle_cursor' }

function countChars(lines: string[]): number {
  return lines.reduce((sum, l) => sum + l.length, 0) + Math.max(0, lines.length - 1)
}

function ensureVisible(cursorRow: number, scrollY: number): number {
  if (cursorRow < scrollY) return cursorRow
  if (cursorRow >= scrollY + VIEW_HEIGHT) return cursorRow - VIEW_HEIGHT + 1
  return scrollY
}

function wordBoundaryBack(line: string, col: number): number {
  let i = col - 1
  while (i > 0 && line[i] === ' ') i--
  while (i > 0 && line[i - 1] !== ' ') i--
  return Math.max(0, i)
}

function wordBoundaryForward(line: string, col: number): number {
  let i = col
  while (i < line.length && line[i] === ' ') i++
  while (i < line.length && line[i] !== ' ') i++
  return i
}

function reducer(state: State, action: Action): State {
  const { lines, cursorRow, cursorCol } = state
  const line = lines[cursorRow] ?? ''

  function withLines(newLines: string[], row: number, col: number): State {
    const r = Math.max(0, Math.min(newLines.length - 1, row))
    const c = Math.max(0, Math.min(newLines[r]?.length ?? 0, col))
    return {
      ...state,
      lines: newLines,
      cursorRow: r,
      cursorCol: c,
      scrollY: ensureVisible(r, state.scrollY),
      charCount: countChars(newLines),
    }
  }

  switch (action.type) {
    case 'insert_char': {
      const newLine = line.slice(0, cursorCol) + action.char + line.slice(cursorCol)
      const newLines = [...lines]
      newLines[cursorRow] = newLine
      return withLines(newLines, cursorRow, cursorCol + 1)
    }
    case 'insert_newline': {
      if (lines.length >= MAX_LINES) return state
      const before = line.slice(0, cursorCol)
      const after = line.slice(cursorCol)
      const newLines = [...lines]
      newLines.splice(cursorRow, 1, before, after)
      return withLines(newLines, cursorRow + 1, 0)
    }
    case 'delete_back': {
      if (cursorCol > 0) {
        const newLine = line.slice(0, cursorCol - 1) + line.slice(cursorCol)
        const newLines = [...lines]
        newLines[cursorRow] = newLine
        return withLines(newLines, cursorRow, cursorCol - 1)
      }
      if (cursorRow > 0) {
        const prevLine = lines[cursorRow - 1]
        const prevLen = prevLine.length
        const merged = prevLine + line
        const newLines = [...lines]
        newLines.splice(cursorRow - 1, 2, merged)
        return withLines(newLines, cursorRow - 1, prevLen)
      }
      return state
    }
    case 'delete_forward': {
      if (cursorCol < line.length) {
        const newLine = line.slice(0, cursorCol) + line.slice(cursorCol + 1)
        const newLines = [...lines]
        newLines[cursorRow] = newLine
        return withLines(newLines, cursorRow, cursorCol)
      }
      if (cursorRow < lines.length - 1) {
        const nextLine = lines[cursorRow + 1]
        const merged = line + nextLine
        const newLines = [...lines]
        newLines.splice(cursorRow, 2, merged)
        return withLines(newLines, cursorRow, cursorCol)
      }
      return state
    }
    case 'delete_word_back': {
      const target = wordBoundaryBack(line, cursorCol)
      const newLine = line.slice(0, target) + line.slice(cursorCol)
      const newLines = [...lines]
      newLines[cursorRow] = newLine
      return withLines(newLines, cursorRow, target)
    }
    case 'delete_line': {
      if (lines.length <= 1) return withLines([''], 0, 0)
      const newLines = [...lines]
      newLines.splice(cursorRow, 1)
      const newRow = Math.min(cursorRow, newLines.length - 1)
      return withLines(newLines, newRow, Math.min(cursorCol, newLines[newRow].length))
    }
    case 'cursor_up': {
      if (cursorRow === 0) return state
      const newCol = Math.min(cursorCol, lines[cursorRow - 1].length)
      return { ...state, cursorRow: cursorRow - 1, cursorCol: newCol, scrollY: ensureVisible(cursorRow - 1, state.scrollY) }
    }
    case 'cursor_down': {
      if (cursorRow >= lines.length - 1) return state
      const newCol = Math.min(cursorCol, lines[cursorRow + 1].length)
      return { ...state, cursorRow: cursorRow + 1, cursorCol: newCol, scrollY: ensureVisible(cursorRow + 1, state.scrollY) }
    }
    case 'cursor_left':
      if (cursorCol > 0) return { ...state, cursorCol: cursorCol - 1 }
      if (cursorRow > 0) return { ...state, cursorRow: cursorRow - 1, cursorCol: lines[cursorRow - 1].length, scrollY: ensureVisible(cursorRow - 1, state.scrollY) }
      return state
    case 'cursor_right':
      if (cursorCol < line.length) return { ...state, cursorCol: cursorCol + 1 }
      if (cursorRow < lines.length - 1) return { ...state, cursorRow: cursorRow + 1, cursorCol: 0, scrollY: ensureVisible(cursorRow + 1, state.scrollY) }
      return state
    case 'cursor_home':
      return { ...state, cursorCol: 0 }
    case 'cursor_end':
      return { ...state, cursorCol: line.length }
    case 'cursor_word_left':
      return { ...state, cursorCol: wordBoundaryBack(line, cursorCol) }
    case 'cursor_word_right':
      return { ...state, cursorCol: wordBoundaryForward(line, cursorCol) }
    case 'page_up': {
      const newRow = Math.max(0, cursorRow - VIEW_HEIGHT)
      return { ...state, cursorRow: newRow, cursorCol: Math.min(cursorCol, lines[newRow].length), scrollY: ensureVisible(newRow, state.scrollY) }
    }
    case 'page_down': {
      const newRow = Math.min(lines.length - 1, cursorRow + VIEW_HEIGHT)
      return { ...state, cursorRow: newRow, cursorCol: Math.min(cursorCol, lines[newRow].length), scrollY: ensureVisible(newRow, state.scrollY) }
    }
    case 'goto_top':
      return { ...state, cursorRow: 0, cursorCol: 0, scrollY: 0 }
    case 'goto_bottom': {
      const lastRow = lines.length - 1
      return { ...state, cursorRow: lastRow, cursorCol: lines[lastRow].length, scrollY: ensureVisible(lastRow, state.scrollY) }
    }
    case 'toggle_cursor':
      return { ...state, cursorVisible: !state.cursorVisible }
  }
}

// --- Demo content ---

const INITIAL_LINES = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func fibonacci(n int) int {',
  '\tif n <= 1 {',
  '\t\treturn n',
  '\t}',
  '\treturn fibonacci(n-1) + fibonacci(n-2)',
  '}',
  '',
  'func main() {',
  '\tfor i := 0; i < 10; i++ {',
  '\t\tfmt.Printf("F(%d) = %d\\n", i, fibonacci(i))',
  '\t}',
  '}',
  '',
  '// Output:',
  '// F(0) = 0',
  '// F(1) = 1',
  '// F(2) = 1',
  '// F(3) = 2',
  '// F(4) = 3',
  '// F(5) = 5',
  '// F(6) = 8',
  '// F(7) = 13',
  '// F(8) = 21',
  '// F(9) = 34',
]

// --- Component ---

export function TextArea() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    lines: [...INITIAL_LINES],
    cursorRow: 0,
    cursorCol: 0,
    scrollY: 0,
    cursorVisible: true,
    charCount: countChars(INITIAL_LINES),
  })

  // Cursor blink
  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: 'toggle_cursor' }), 530)
    return () => clearInterval(timer)
  }, [])

  useInput((ch, key) => {
    if (key.upArrow) dispatch({ type: 'cursor_up' })
    else if (key.downArrow) dispatch({ type: 'cursor_down' })
    else if (key.leftArrow) {
      if (key.meta || key.ctrl) dispatch({ type: 'cursor_word_left' })
      else dispatch({ type: 'cursor_left' })
    } else if (key.rightArrow) {
      if (key.meta || key.ctrl) dispatch({ type: 'cursor_word_right' })
      else dispatch({ type: 'cursor_right' })
    } else if (key.return) dispatch({ type: 'insert_newline' })
    else if (key.backspace) {
      if (key.meta || key.ctrl) dispatch({ type: 'delete_word_back' })
      else dispatch({ type: 'delete_back' })
    } else if (key.delete) dispatch({ type: 'delete_forward' })
    else if (key.pageUp) dispatch({ type: 'page_up' })
    else if (key.pageDown) dispatch({ type: 'page_down' })
    else if (key.ctrl && ch === 'a') dispatch({ type: 'cursor_home' })
    else if (key.ctrl && ch === 'e') dispatch({ type: 'cursor_end' })
    else if (key.ctrl && ch === 'k') dispatch({ type: 'delete_line' })
    else if (ch && !key.ctrl && !key.meta && ch.length === 1 && ch >= ' ') {
      dispatch({ type: 'insert_char', char: ch })
    }
  })

  const { lines, cursorRow, cursorCol, scrollY, cursorVisible } = state
  const visibleLines = lines.slice(scrollY, scrollY + VIEW_HEIGHT)
  const lineNumWidth = String(lines.length).length

  return (
    <Box flexDirection="column" paddingX={1} overflow="hidden">
      <Box marginBottom={0} justifyContent="space-between">
        <Box gap={2}>
          <Text bold color={colors.primary}>TextArea</Text>
          <Text dimColor>main.go</Text>
        </Box>
        <Text dimColor>
          Ln {cursorRow + 1}, Col {cursorCol + 1} | {lines.length} lines | {state.charCount} chars
        </Text>
      </Box>

      <Text dimColor wrap="truncate-end">{'\u2500'.repeat(200)}</Text>

      <Box flexDirection="column">
        {visibleLines.map((line, vi) => {
          const lineIdx = scrollY + vi
          const isActiveLine = lineIdx === cursorRow
          const lineNum = String(lineIdx + 1).padStart(lineNumWidth, ' ')
          const displayLine = line.replace(/\t/g, '  ')
          const adjustedCol = line.slice(0, cursorCol).replace(/\t/g, '  ').length

          if (!isActiveLine) {
            return (
              <Text key={lineIdx} wrap="truncate-end">
                <Text dimColor>{lineNum} │ </Text>
                <Text>{displayLine}</Text>
              </Text>
            )
          }

          const before = displayLine.slice(0, adjustedCol)
          const cursorChar = adjustedCol < displayLine.length ? displayLine[adjustedCol] : ' '
          const after = adjustedCol < displayLine.length ? displayLine.slice(adjustedCol + 1) : ''

          return (
            <Box key={lineIdx}>
              <Text color={colors.primary}>{lineNum} │ </Text>
              <Text>{before}</Text>
              <Text inverse={cursorVisible}>{cursorChar}</Text>
              <Text>{after}</Text>
            </Box>
          )
        })}
      </Box>

      <Text dimColor wrap="truncate-end">{'\u2500'.repeat(200)}</Text>

      <Box marginTop={0} gap={2}>
        <Box><Text inverse bold> ↑↓←→ </Text><Text dimColor> move</Text></Box>
        <Box><Text inverse bold> enter </Text><Text dimColor> newline</Text></Box>
        <Box><Text inverse bold> ^k </Text><Text dimColor> del line</Text></Box>
        <Box><Text inverse bold> pgUp/Dn </Text><Text dimColor> page</Text></Box>
      </Box>
    </Box>
  )
}
