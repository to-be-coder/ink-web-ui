import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

const INITIAL = [
  "import express from 'express'",
  "import { requireAuth } from './auth'",
  "",
  "const app = express()",
  "",
  "app.use('/api', requireAuth)",
  "app.listen(3000)",
]

export function CleanTextArea() {
  const colors = useTheme()
  const [lines, setLines] = useState(INITIAL)
  const [row, setRow] = useState(0)
  const [col, setCol] = useState(0)
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 500)
    return () => clearInterval(id)
  }, [])

  useInput((ch, key) => {
    if (key.upArrow) {
      setRow(r => Math.max(0, r - 1))
      setCol(c => Math.min(c, (lines[Math.max(0, row - 1)] ?? '').length))
      return
    }
    if (key.downArrow) {
      setRow(r => Math.min(lines.length - 1, r + 1))
      setCol(c => Math.min(c, (lines[Math.min(lines.length - 1, row + 1)] ?? '').length))
      return
    }
    if (key.leftArrow) { setCol(c => Math.max(0, c - 1)); return }
    if (key.rightArrow) { setCol(c => Math.min((lines[row] ?? '').length, c + 1)); return }

    if (key.return) {
      const line = lines[row] ?? ''
      const before = line.slice(0, col)
      const after = line.slice(col)
      setLines(prev => [...prev.slice(0, row), before, after, ...prev.slice(row + 1)])
      setRow(r => r + 1)
      setCol(0)
      return
    }

    if (key.backspace || key.delete) {
      if (col > 0) {
        setLines(prev => prev.map((l, i) => i === row ? l.slice(0, col - 1) + l.slice(col) : l))
        setCol(c => c - 1)
      } else if (row > 0) {
        const prevLine = lines[row - 1] ?? ''
        const curLine = lines[row] ?? ''
        setLines(prev => [...prev.slice(0, row - 1), prevLine + curLine, ...prev.slice(row + 1)])
        setRow(r => r - 1)
        setCol(prevLine.length)
      }
      return
    }

    if (ch && !key.ctrl && !key.meta) {
      setLines(prev => prev.map((l, i) => i === row ? l.slice(0, col) + ch + l.slice(col) : l))
      setCol(c => c + 1)
    }
  })

  const gutterW = String(lines.length).length + 1

  return (
    <Box flexDirection="column" padding={1}>
      {lines.map((line, i) => (
        <Box key={i}>
          <Text dimColor>{String(i + 1).padStart(gutterW)} </Text>
          <Text dimColor>{'\u2502'} </Text>
          {i === row ? (
            <Text>
              {line.slice(0, col)}
              <Text inverse={blink}>{line[col] ?? ' '}</Text>
              {line.slice(col + 1)}
            </Text>
          ) : (
            <Text>{line}</Text>
          )}
        </Box>
      ))}

      <Box marginTop={1}>
        <Text dimColor>Ln {row + 1}, Col {col + 1} \u2502 {lines.length} lines</Text>
      </Box>

      <Help keys={[{ key: '\u2191\u2193\u2190\u2192', label: 'move' }, { key: 'enter', label: 'newline' }]} />
    </Box>
  )
}
