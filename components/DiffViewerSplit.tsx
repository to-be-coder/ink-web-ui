import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

interface SplitLine {
  oldNum?: number
  oldText?: string
  oldType: 'remove' | 'context' | 'empty'
  newNum?: number
  newText?: string
  newType: 'add' | 'context' | 'empty'
}

interface SplitFile {
  path: string
  additions: number
  deletions: number
  lines: SplitLine[]
}

/* ── Demo data ── */

const FILES: SplitFile[] = [
  {
    path: 'src/auth.ts',
    additions: 12,
    deletions: 3,
    lines: [
      { oldNum: 1, oldText: "import jwt from 'jsonwebtoken'", oldType: 'context', newNum: 1, newText: "import jwt from 'jsonwebtoken'", newType: 'context' },
      { oldNum: 2, oldText: "import { Request, Response } from 'express'", oldType: 'context', newNum: 2, newText: "import { Request, Response, Next } from 'express'", newType: 'context' },
      { oldNum: 3, oldText: '', oldType: 'context', newNum: 3, newText: "import { JwtPayload } from './types'", newType: 'add' },
      { oldNum: 4, oldText: 'const SECRET = "my-secret"', oldType: 'remove', newNum: 4, newText: 'const SECRET = process.env.JWT_SECRET!', newType: 'add' },
      { oldNum: 5, oldText: '', oldType: 'context', newNum: 5, newText: '', newType: 'context' },
      { oldNum: 6, oldText: 'export function verify(token: string) {', oldType: 'remove', newNum: 6, newText: 'export function verifyToken(token: string): JwtPayload {', newType: 'add' },
      { oldNum: 7, oldText: '  return jwt.verify(token, SECRET) as any', oldType: 'remove', newNum: 7, newText: '  return jwt.verify(token, SECRET) as JwtPayload', newType: 'add' },
      { oldNum: 8, oldText: '}', oldType: 'context', newNum: 8, newText: '}', newType: 'context' },
      { oldType: 'empty', newNum: 9, newText: '', newType: 'add' },
      { oldType: 'empty', newNum: 10, newText: 'export function requireAuth(req: Request, res: Response, next: Next) {', newType: 'add' },
      { oldType: 'empty', newNum: 11, newText: '  const header = req.headers.authorization', newType: 'add' },
      { oldType: 'empty', newNum: 12, newText: "  if (!header) return res.status(401).json({ error: 'Unauthorized' })", newType: 'add' },
      { oldType: 'empty', newNum: 13, newText: '  try {', newType: 'add' },
      { oldType: 'empty', newNum: 14, newText: "    req.user = verifyToken(header.slice(7))", newType: 'add' },
      { oldType: 'empty', newNum: 15, newText: '    next()', newType: 'add' },
      { oldType: 'empty', newNum: 16, newText: '  } catch {', newType: 'add' },
      { oldType: 'empty', newNum: 17, newText: "    res.status(401).json({ error: 'Invalid token' })", newType: 'add' },
      { oldType: 'empty', newNum: 18, newText: '  }', newType: 'add' },
      { oldType: 'empty', newNum: 19, newText: '}', newType: 'add' },
    ],
  },
  {
    path: 'src/routes.ts',
    additions: 4,
    deletions: 2,
    lines: [
      { oldNum: 1, oldText: "import express from 'express'", oldType: 'context', newNum: 1, newText: "import express from 'express'", newType: 'context' },
      { oldNum: 2, oldText: "import { userCtrl } from './controllers'", oldType: 'context', newNum: 2, newText: "import { userCtrl } from './controllers'", newType: 'context' },
      { oldNum: 3, oldText: '// TODO: add auth', oldType: 'remove', newNum: 3, newText: "import { requireAuth } from './auth'", newType: 'add' },
      { oldNum: 4, oldText: '', oldType: 'context', newNum: 4, newText: '', newType: 'context' },
      { oldNum: 5, oldText: 'const router = express.Router()', oldType: 'context', newNum: 5, newText: 'const router = express.Router()', newType: 'context' },
      { oldNum: 6, oldText: '', oldType: 'context', newNum: 6, newText: '', newType: 'context' },
      { oldNum: 7, oldText: "router.get('/users', userCtrl.list)", oldType: 'remove', newNum: 7, newText: "router.get('/users', requireAuth, userCtrl.list)", newType: 'add' },
      { oldNum: 8, oldText: "router.post('/users', userCtrl.create)", oldType: 'context', newNum: 8, newText: "router.post('/users', requireAuth, userCtrl.create)", newType: 'add' },
      { oldType: 'empty', newNum: 9, newText: "router.delete('/users/:id', requireAuth, userCtrl.remove)", newType: 'add' },
      { oldNum: 9, oldText: '', oldType: 'context', newNum: 10, newText: '', newType: 'context' },
      { oldNum: 10, oldText: 'export default router', oldType: 'context', newNum: 11, newText: 'export default router', newType: 'context' },
    ],
  },
]

const HALF_WIDTH = 38
const MAX_VISIBLE = 18

/* ── Main ── */

export function DiffViewerSplit() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [fileIdx, setFileIdx] = useState(0)
  const [scroll, setScroll] = useState(0)

  const file = FILES[fileIdx]!

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) { stdout.write('\x1b[2J\x1b[H'); setReady(true) }
    }, 300)
    return () => { mountedRef.current = false; clearTimeout(id) }
  }, [])

  useEffect(() => { setScroll(0) }, [fileIdx])

  useInput((ch, key) => {
    if (key.tab || ch === 'f') setFileIdx(i => (i + 1) % FILES.length)
    if (ch === 'j' || key.downArrow) setScroll(s => Math.min(s + 1, Math.max(0, file.lines.length - MAX_VISIBLE)))
    if (ch === 'k' || key.upArrow) setScroll(s => Math.max(0, s - 1))
  })

  if (!ready) return <Box />

  const visible = file.lines.slice(scroll, scroll + MAX_VISIBLE)
  const totalAdd = FILES.reduce((s, f) => s + f.additions, 0)
  const totalDel = FILES.reduce((s, f) => s + f.deletions, 0)

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Text bold color={colors.primary}>Split Diff</Text>
          <Text dimColor>{fileIdx + 1}/{FILES.length} files</Text>
        </Box>
        <Box gap={1}>
          <Text color={colors.success} bold>+{totalAdd}</Text>
          <Text color={colors.error} bold>-{totalDel}</Text>
        </Box>
      </Box>

      {/* File tabs */}
      <Box gap={2} marginTop={1}>
        {FILES.map((f, i) => (
          <Box key={f.path} gap={1}>
            <Text bold={i === fileIdx} color={i === fileIdx ? colors.primary : undefined} dimColor={i !== fileIdx} underline={i === fileIdx}>
              {f.path}
            </Text>
            <Text dimColor={i !== fileIdx}><Text color={colors.success}>+{f.additions}</Text> <Text color={colors.error}>-{f.deletions}</Text></Text>
          </Box>
        ))}
      </Box>

      {/* Column headers */}
      <Box marginTop={1}>
        <Box width={HALF_WIDTH}>
          <Text dimColor bold>  Original</Text>
        </Box>
        <Text dimColor> │ </Text>
        <Box width={HALF_WIDTH}>
          <Text dimColor bold>  Modified</Text>
        </Box>
      </Box>
      <Box>
        <Text dimColor>{'─'.repeat(HALF_WIDTH)} ┼ {'─'.repeat(HALF_WIDTH)}</Text>
      </Box>

      {/* Side-by-side lines */}
      {visible.map((line, i) => {
        const oldColor = line.oldType === 'remove' ? colors.error : undefined
        const newColor = line.newType === 'add' ? colors.success : undefined
        const oldDim = line.oldType === 'context' || line.oldType === 'empty'
        const newDim = line.newType === 'context' || line.newType === 'empty'
        const oldNum = line.oldNum != null ? String(line.oldNum).padStart(3) : '   '
        const newNum = line.newNum != null ? String(line.newNum).padStart(3) : '   '
        const oldPrefix = line.oldType === 'remove' ? '-' : ' '
        const newPrefix = line.newType === 'add' ? '+' : ' '

        const truncate = (s: string | undefined, max: number) => {
          if (!s) return ''
          return s.length > max ? s.slice(0, max - 1) + '…' : s
        }

        const oldContent = line.oldType === 'empty' ? '' : truncate(line.oldText, HALF_WIDTH - 6)
        const newContent = line.newType === 'empty' ? '' : truncate(line.newText, HALF_WIDTH - 6)

        return (
          <Box key={i + scroll}>
            {/* Left (old) */}
            <Box width={HALF_WIDTH}>
              <Text dimColor>{oldNum} </Text>
              <Text color={oldColor} bold={line.oldType === 'remove'}>{oldPrefix}</Text>
              <Text color={oldColor} dimColor={oldDim}> {oldContent}</Text>
            </Box>

            <Text dimColor> │ </Text>

            {/* Right (new) */}
            <Box width={HALF_WIDTH}>
              <Text dimColor>{newNum} </Text>
              <Text color={newColor} bold={line.newType === 'add'}>{newPrefix}</Text>
              <Text color={newColor} dimColor={newDim}> {newContent}</Text>
            </Box>
          </Box>
        )
      })}

      {/* Scroll indicator */}
      {file.lines.length > MAX_VISIBLE && (
        <Box marginTop={1}>
          <Text dimColor>lines {scroll + 1}–{Math.min(scroll + MAX_VISIBLE, file.lines.length)} of {file.lines.length}</Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> f </Text><Text dimColor> file</Text></Box>
        <Box><Text inverse bold> j/k </Text><Text dimColor> scroll</Text></Box>
      </Box>
    </Box>
  )
}
