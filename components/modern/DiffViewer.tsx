import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Badge } from './utils'

/* ── Types ── */

type LineType = 'add' | 'remove' | 'context' | 'header' | 'collapse'

interface DiffLine {
  type: LineType
  oldNum?: number
  newNum?: number
  text: string
}

interface DiffFile {
  path: string
  additions: number
  deletions: number
  lines: DiffLine[]
}

/* ── Demo data ── */

const FILES: DiffFile[] = [
  {
    path: 'src/routes.ts',
    additions: 5,
    deletions: 1,
    lines: [
      { type: 'header', text: '@@ -10,6 +10,10 @@' },
      { type: 'context', oldNum: 10, newNum: 10, text: "import express from 'express'" },
      { type: 'context', oldNum: 11, newNum: 11, text: "import { userController } from './controllers'" },
      { type: 'remove', oldNum: 12, text: '// TODO: add auth' },
      { type: 'add', newNum: 12, text: "import { requireAuth } from './auth'" },
      { type: 'add', newNum: 13, text: '' },
      { type: 'context', oldNum: 13, newNum: 14, text: 'const router = express.Router()' },
      { type: 'context', oldNum: 14, newNum: 15, text: '' },
      { type: 'collapse', text: '... 8 unchanged lines ...' },
      { type: 'context', oldNum: 23, newNum: 24, text: "router.get('/health', (req, res) => {" },
      { type: 'context', oldNum: 24, newNum: 25, text: "  res.json({ status: 'ok' })" },
      { type: 'context', oldNum: 25, newNum: 26, text: '})' },
      { type: 'add', newNum: 27, text: '' },
      { type: 'add', newNum: 28, text: "router.use('/users', requireAuth)" },
      { type: 'add', newNum: 29, text: "router.post('/auth/login', authController.login)" },
      { type: 'context', oldNum: 26, newNum: 30, text: '' },
      { type: 'context', oldNum: 27, newNum: 31, text: 'export default router' },
    ],
  },
  {
    path: 'src/auth.ts',
    additions: 18,
    deletions: 0,
    lines: [
      { type: 'header', text: '@@ -0,0 +1,18 @@' },
      { type: 'add', newNum: 1, text: "import jwt from 'jsonwebtoken'" },
      { type: 'add', newNum: 2, text: "import { Request, Response, NextFunction } from 'express'" },
      { type: 'add', newNum: 3, text: '' },
      { type: 'add', newNum: 4, text: 'const SECRET = process.env.JWT_SECRET!' },
      { type: 'add', newNum: 5, text: '' },
      { type: 'add', newNum: 6, text: 'export function verifyToken(token: string) {' },
      { type: 'add', newNum: 7, text: '  return jwt.verify(token, SECRET)' },
      { type: 'add', newNum: 8, text: '}' },
      { type: 'add', newNum: 9, text: '' },
      { type: 'add', newNum: 10, text: 'export function requireAuth(req: Request, res: Response, next: NextFunction) {' },
      { type: 'add', newNum: 11, text: "  const header = req.headers.authorization" },
      { type: 'add', newNum: 12, text: "  if (!header) return res.status(401).json({ error: 'Missing token' })" },
      { type: 'add', newNum: 13, text: '  try {' },
      { type: 'add', newNum: 14, text: "    req.user = verifyToken(header.replace('Bearer ', ''))" },
      { type: 'add', newNum: 15, text: '    next()' },
      { type: 'add', newNum: 16, text: '  } catch {' },
      { type: 'add', newNum: 17, text: "    res.status(401).json({ error: 'Invalid token' })" },
      { type: 'add', newNum: 18, text: '  }' },
    ],
  },
  {
    path: 'src/types.ts',
    additions: 6,
    deletions: 0,
    lines: [
      { type: 'header', text: '@@ -14,3 +14,9 @@' },
      { type: 'context', oldNum: 14, newNum: 14, text: "export interface Config {" },
      { type: 'context', oldNum: 15, newNum: 15, text: "  port: number" },
      { type: 'context', oldNum: 16, newNum: 16, text: "}" },
      { type: 'add', newNum: 17, text: '' },
      { type: 'add', newNum: 18, text: 'export interface User {' },
      { type: 'add', newNum: 19, text: '  id: string' },
      { type: 'add', newNum: 20, text: '  email: string' },
      { type: 'add', newNum: 21, text: '}' },
      { type: 'add', newNum: 22, text: '' },
    ],
  },
]

/* ── Main ── */

export function ModernDiffViewer() {
  const colors = useTheme()
  const [fileIdx, setFileIdx] = useState(0)
  const [scroll, setScroll] = useState(0)
  const [compact, setCompact] = useState(false)

  const file = FILES[fileIdx]!
  const totalAdd = FILES.reduce((s, f) => s + f.additions, 0)
  const totalDel = FILES.reduce((s, f) => s + f.deletions, 0)

  const visibleLines = compact
    ? file.lines.filter(l => l.type !== 'context' && l.type !== 'collapse')
    : file.lines

  useInput((ch, key) => {
    if (key.tab || ch === 'f') setFileIdx(i => (i + 1) % FILES.length)
    if (key.upArrow) setScroll(s => Math.max(0, s - 1))
    if (key.downArrow) setScroll(s => Math.min(visibleLines.length - 1, s + 1))
    if (ch === 'd') setCompact(c => !c)
  })

  // Reset scroll on file change
  useEffect(() => { setScroll(0) }, [fileIdx])

  const gutterW = 4

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        {/* Header */}
        <Box justifyContent="space-between" marginBottom={1}>
          <Box gap={1}>
            <Text bold color={colors.primary}>Diff Viewer</Text>
            <Text dimColor>{fileIdx + 1}/{FILES.length} files</Text>
          </Box>
          <Box gap={1}>
            <Text color={colors.success} bold>+{totalAdd}</Text>
            <Text color={colors.error} bold>-{totalDel}</Text>
          </Box>
        </Box>

        {/* File tabs */}
        <Box gap={1} marginBottom={1}>
          {FILES.map((f, i) => (
            <Box key={f.path}>
              {i === fileIdx ? (
                <Badge label={f.path} color={colors.primary} />
              ) : (
                <Text dimColor>{f.path}</Text>
              )}
            </Box>
          ))}
        </Box>

        {/* File stats */}
        <Box marginBottom={1} gap={1}>
          <Text color={colors.success}>+{file.additions}</Text>
          <Text color={colors.error}>-{file.deletions}</Text>
        </Box>

        {/* Diff lines */}
        <Box flexDirection="column">
          {visibleLines.map((line, i) => {
            if (line.type === 'header') {
              return (
                <Box key={i}>
                  <Text color={colors.info} dimColor>{line.text}</Text>
                </Box>
              )
            }

            if (line.type === 'collapse') {
              return (
                <Box key={i} justifyContent="center">
                  <Text dimColor>{line.text}</Text>
                </Box>
              )
            }

            const lineColor = line.type === 'add' ? colors.success : line.type === 'remove' ? colors.error : undefined
            const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '
            const oldG = line.oldNum != null ? String(line.oldNum).padStart(gutterW) : ' '.repeat(gutterW)
            const newG = line.newNum != null ? String(line.newNum).padStart(gutterW) : ' '.repeat(gutterW)

            return (
              <Box key={i}>
                <Text dimColor>{oldG} {newG} </Text>
                <Text color={lineColor} dimColor={line.type === 'context'}>
                  {prefix} {line.text}
                </Text>
              </Box>
            )
          })}
        </Box>

        <HelpFooter keys={[
          { key: 'f', label: 'next file' },
          { key: '\u2191\u2193', label: 'scroll' },
          { key: 'd', label: compact ? 'full' : 'compact' },
        ]} />
      </Card>
    </Box>
  )
}
