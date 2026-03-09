import { useReducer, useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter } from './utils'

/* ── State ── */

interface State {
  lines: string[]
  cursorLine: number
  cursorCol: number
  viewStart: number
  modified: boolean
}

type Action =
  | { type: 'char'; ch: string }
  | { type: 'backspace' }
  | { type: 'delete' }
  | { type: 'enter' }
  | { type: 'up' }
  | { type: 'down' }
  | { type: 'left' }
  | { type: 'right' }
  | { type: 'home' }
  | { type: 'end' }
  | { type: 'page_up'; viewSize: number }
  | { type: 'page_down'; viewSize: number }
  | { type: 'delete_line' }
  | { type: 'tab' }

const VIEW_SIZE = 14

function reducer(state: State, action: Action): State {
  const { lines, cursorLine, cursorCol } = state
  const line = lines[cursorLine] ?? ''

  switch (action.type) {
    case 'char': {
      const newLine = line.slice(0, cursorCol) + action.ch + line.slice(cursorCol)
      const newLines = [...lines]
      newLines[cursorLine] = newLine
      return { ...state, lines: newLines, cursorCol: cursorCol + 1, modified: true }
    }
    case 'tab': {
      const newLine = line.slice(0, cursorCol) + '  ' + line.slice(cursorCol)
      const newLines = [...lines]
      newLines[cursorLine] = newLine
      return { ...state, lines: newLines, cursorCol: cursorCol + 2, modified: true }
    }
    case 'backspace': {
      if (cursorCol > 0) {
        const newLine = line.slice(0, cursorCol - 1) + line.slice(cursorCol)
        const newLines = [...lines]
        newLines[cursorLine] = newLine
        return { ...state, lines: newLines, cursorCol: cursorCol - 1, modified: true }
      }
      if (cursorLine > 0) {
        const prevLine = lines[cursorLine - 1]!
        const newLines = [...lines]
        newLines[cursorLine - 1] = prevLine + line
        newLines.splice(cursorLine, 1)
        return { ...state, lines: newLines, cursorLine: cursorLine - 1, cursorCol: prevLine.length, modified: true }
      }
      return state
    }
    case 'delete': {
      if (cursorCol < line.length) {
        const newLine = line.slice(0, cursorCol) + line.slice(cursorCol + 1)
        const newLines = [...lines]
        newLines[cursorLine] = newLine
        return { ...state, lines: newLines, modified: true }
      }
      if (cursorLine < lines.length - 1) {
        const nextLine = lines[cursorLine + 1]!
        const newLines = [...lines]
        newLines[cursorLine] = line + nextLine
        newLines.splice(cursorLine + 1, 1)
        return { ...state, lines: newLines, modified: true }
      }
      return state
    }
    case 'enter': {
      const before = line.slice(0, cursorCol)
      const after = line.slice(cursorCol)
      const indent = before.match(/^\s*/)?.[0] ?? ''
      const newLines = [...lines]
      newLines[cursorLine] = before
      newLines.splice(cursorLine + 1, 0, indent + after)
      return { ...state, lines: newLines, cursorLine: cursorLine + 1, cursorCol: indent.length, modified: true }
    }
    case 'up': {
      if (cursorLine <= 0) return state
      const prevLen = (lines[cursorLine - 1] ?? '').length
      return { ...state, cursorLine: cursorLine - 1, cursorCol: Math.min(cursorCol, prevLen) }
    }
    case 'down': {
      if (cursorLine >= lines.length - 1) return state
      const nextLen = (lines[cursorLine + 1] ?? '').length
      return { ...state, cursorLine: cursorLine + 1, cursorCol: Math.min(cursorCol, nextLen) }
    }
    case 'left': return { ...state, cursorCol: Math.max(0, cursorCol - 1) }
    case 'right': return { ...state, cursorCol: Math.min(line.length, cursorCol + 1) }
    case 'home': return { ...state, cursorCol: 0 }
    case 'end': return { ...state, cursorCol: line.length }
    case 'page_up': return { ...state, cursorLine: Math.max(0, cursorLine - action.viewSize) }
    case 'page_down': return { ...state, cursorLine: Math.min(lines.length - 1, cursorLine + action.viewSize) }
    case 'delete_line': {
      if (lines.length <= 1) return { ...state, lines: [''], cursorCol: 0, modified: true }
      const newLines = lines.filter((_, i) => i !== cursorLine)
      const newCL = Math.min(cursorLine, newLines.length - 1)
      return { ...state, lines: newLines, cursorLine: newCL, cursorCol: Math.min(cursorCol, (newLines[newCL] ?? '').length), modified: true }
    }
  }
}

/* ── Initial content ── */

const INITIAL_CONTENT = `import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'viewer'
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
  }, [])

  return { users, loading }
}`.split('\n')

/* ── Main ── */

export function ModernTextArea() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    lines: INITIAL_CONTENT,
    cursorLine: 0,
    cursorCol: 0,
    viewStart: 0,
    modified: false,
  })
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setCursorVisible(v => !v), 530)
    return () => clearInterval(id)
  }, [])

  useInput((ch, key) => {
    if (key.upArrow) dispatch({ type: 'up' })
    else if (key.downArrow) dispatch({ type: 'down' })
    else if (key.leftArrow) dispatch({ type: 'left' })
    else if (key.rightArrow) dispatch({ type: 'right' })
    else if (key.return) dispatch({ type: 'enter' })
    else if (key.backspace) dispatch({ type: 'backspace' })
    else if (key.delete) dispatch({ type: 'delete' })
    else if (key.tab) dispatch({ type: 'tab' })
    else if (key.pageUp) dispatch({ type: 'page_up', viewSize: VIEW_SIZE })
    else if (key.pageDown) dispatch({ type: 'page_down', viewSize: VIEW_SIZE })
    else if (ch === '\x01') dispatch({ type: 'home' })
    else if (ch === '\x05') dispatch({ type: 'end' })
    else if (ch === '\x0B') dispatch({ type: 'delete_line' })
    else if (ch && !key.ctrl && !key.meta && !key.escape && ch.length === 1) {
      dispatch({ type: 'char', ch })
    }
  })

  // Scroll viewport
  let viewStart = state.viewStart
  if (state.cursorLine < viewStart) viewStart = state.cursorLine
  if (state.cursorLine >= viewStart + VIEW_SIZE) viewStart = state.cursorLine - VIEW_SIZE + 1
  viewStart = Math.max(0, viewStart)

  const gutterWidth = Math.max(3, String(state.lines.length).length + 1)
  const visibleLines = state.lines.slice(viewStart, viewStart + VIEW_SIZE)
  const totalChars = state.lines.reduce((a, l) => a + l.length, 0)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card paddingX={1} paddingY={0}>
        {/* Title bar */}
        <Box justifyContent="space-between" marginBottom={0} paddingY={1}>
          <Box gap={1}>
            <Text bold color={colors.primary}>useUsers.tsx</Text>
            {state.modified && <Text color={colors.warning}>{'\u25CF'}</Text>}
          </Box>
          <Text dimColor>TypeScript</Text>
        </Box>

        {/* Editor */}
        {visibleLines.map((line, vi) => {
          const lineNum = viewStart + vi
          const isCurrentLine = lineNum === state.cursorLine
          const lineStr = (lineNum + 1).toString().padStart(gutterWidth)

          return (
            <Box key={lineNum}>
              {/* Gutter */}
              <Text color={isCurrentLine ? colors.primary : 'gray'}>
                {lineStr}
              </Text>
              <Text color={isCurrentLine ? colors.primary : 'gray'}> {isCurrentLine ? '\u2502' : '\u2502'} </Text>

              {/* Line content */}
              {isCurrentLine ? (
                <Text>
                  {line.slice(0, state.cursorCol)}
                  <Text inverse={cursorVisible}>{line[state.cursorCol] ?? ' '}</Text>
                  {line.slice(state.cursorCol + 1)}
                </Text>
              ) : (
                <Text dimColor={line.trim() === ''}>{line || ' '}</Text>
              )}
            </Box>
          )
        })}

        {/* Status line */}
        <Box justifyContent="space-between" marginTop={0} paddingY={1}>
          <Box gap={2}>
            <Text dimColor>Ln {state.cursorLine + 1}</Text>
            <Text dimColor>Col {state.cursorCol + 1}</Text>
          </Box>
          <Box gap={2}>
            <Text dimColor>{state.lines.length} lines</Text>
            <Text dimColor>{totalChars} chars</Text>
          </Box>
        </Box>

        <HelpFooter keys={[
          { key: '\u2190\u2191\u2192\u2193', label: 'move' },
          { key: 'Ctrl+A/E', label: 'home/end' },
          { key: 'Ctrl+K', label: 'delete line' },
        ]} />
      </Card>
    </Box>
  )
}
