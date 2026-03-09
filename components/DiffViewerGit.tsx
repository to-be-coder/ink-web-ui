import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

type LineType = 'add' | 'remove' | 'context'
type HunkStatus = 'pending' | 'staged' | 'skipped'

interface DiffLine {
  type: LineType
  oldNum?: number
  newNum?: number
  text: string
}

interface Hunk {
  header: string
  lines: DiffLine[]
}

interface DiffFile {
  path: string
  status: 'modified' | 'added' | 'deleted' | 'renamed'
  oldPath?: string
  additions: number
  deletions: number
  hunks: Hunk[]
}

/* ── Demo data ── */

const FILES: DiffFile[] = [
  {
    path: 'src/auth.ts',
    status: 'added',
    additions: 19,
    deletions: 0,
    hunks: [
      {
        header: '@@ -0,0 +1,19 @@',
        lines: [
          { type: 'add', newNum: 1, text: "import jwt from 'jsonwebtoken'" },
          { type: 'add', newNum: 2, text: "import { Request, Response, NextFunction } from 'express'" },
          { type: 'add', newNum: 3, text: "import { JwtPayload } from './types'" },
          { type: 'add', newNum: 4, text: '' },
          { type: 'add', newNum: 5, text: 'const SECRET = process.env.JWT_SECRET!' },
          { type: 'add', newNum: 6, text: '' },
          { type: 'add', newNum: 7, text: 'export function verifyToken(token: string): JwtPayload {' },
          { type: 'add', newNum: 8, text: '  return jwt.verify(token, SECRET) as JwtPayload' },
          { type: 'add', newNum: 9, text: '}' },
          { type: 'add', newNum: 10, text: '' },
          { type: 'add', newNum: 11, text: 'export function requireAuth(' },
          { type: 'add', newNum: 12, text: '  req: Request,' },
          { type: 'add', newNum: 13, text: '  res: Response,' },
          { type: 'add', newNum: 14, text: '  next: NextFunction' },
          { type: 'add', newNum: 15, text: ') {' },
          { type: 'add', newNum: 16, text: '  const token = req.headers.authorization?.slice(7)' },
          { type: 'add', newNum: 17, text: "  if (!token) return res.status(401).json({ error: 'Unauthorized' })" },
          { type: 'add', newNum: 18, text: '  try { req.user = verifyToken(token); next() }' },
          { type: 'add', newNum: 19, text: "  catch { res.status(401).json({ error: 'Invalid token' }) }" },
        ],
      },
    ],
  },
  {
    path: 'src/routes.ts',
    status: 'modified',
    additions: 5,
    deletions: 3,
    hunks: [
      {
        header: '@@ -1,6 +1,7 @@',
        lines: [
          { type: 'context', oldNum: 1, newNum: 1, text: "import express from 'express'" },
          { type: 'context', oldNum: 2, newNum: 2, text: "import { userCtrl } from './controllers'" },
          { type: 'remove', oldNum: 3, text: '// TODO: add auth middleware' },
          { type: 'add', newNum: 3, text: "import { requireAuth } from './auth'" },
          { type: 'add', newNum: 4, text: '' },
          { type: 'context', oldNum: 4, newNum: 5, text: 'const router = express.Router()' },
        ],
      },
      {
        header: '@@ -8,6 +9,9 @@',
        lines: [
          { type: 'context', oldNum: 8, newNum: 9, text: "router.get('/health', (_, res) => res.json({ ok: true }))" },
          { type: 'context', oldNum: 9, newNum: 10, text: '' },
          { type: 'remove', oldNum: 10, text: "router.get('/users', userCtrl.list)" },
          { type: 'remove', oldNum: 11, text: "router.post('/users', userCtrl.create)" },
          { type: 'add', newNum: 11, text: "router.get('/users', requireAuth, userCtrl.list)" },
          { type: 'add', newNum: 12, text: "router.post('/users', requireAuth, userCtrl.create)" },
          { type: 'add', newNum: 13, text: "router.delete('/users/:id', requireAuth, userCtrl.remove)" },
          { type: 'context', oldNum: 12, newNum: 14, text: '' },
          { type: 'context', oldNum: 13, newNum: 15, text: 'export default router' },
        ],
      },
    ],
  },
  {
    path: 'src/types.ts',
    status: 'modified',
    additions: 6,
    deletions: 0,
    hunks: [
      {
        header: '@@ -14,3 +14,9 @@',
        lines: [
          { type: 'context', oldNum: 14, newNum: 14, text: 'export interface Config {' },
          { type: 'context', oldNum: 15, newNum: 15, text: '  port: number' },
          { type: 'context', oldNum: 16, newNum: 16, text: '}' },
          { type: 'add', newNum: 17, text: '' },
          { type: 'add', newNum: 18, text: 'export interface JwtPayload {' },
          { type: 'add', newNum: 19, text: '  sub: string' },
          { type: 'add', newNum: 20, text: '  email: string' },
          { type: 'add', newNum: 21, text: '  iat: number' },
          { type: 'add', newNum: 22, text: '}' },
        ],
      },
    ],
  },
]

const MAX_VISIBLE = 16

/* ── Main ── */

export function DiffViewerGit() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [fileIdx, setFileIdx] = useState(0)
  const [hunkIdx, setHunkIdx] = useState(0)
  const [scroll, setScroll] = useState(0)
  const [hunkStatuses, setHunkStatuses] = useState<HunkStatus[][]>(() =>
    FILES.map(f => f.hunks.map(() => 'pending'))
  )
  const [showTree, setShowTree] = useState(true)

  const file = FILES[fileIdx]!
  const hunkCount = file.hunks.length
  const statuses = hunkStatuses[fileIdx]!

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) { stdout.write('\x1b[2J\x1b[H'); setReady(true) }
    }, 300)
    return () => { mountedRef.current = false; clearTimeout(id) }
  }, [])

  useEffect(() => { setScroll(0); setHunkIdx(0) }, [fileIdx])

  useInput((ch, key) => {
    if (key.tab || ch === 'f') setFileIdx(i => (i + 1) % FILES.length)
    if (ch === 'j' || key.downArrow) setScroll(s => Math.min(s + 1, Math.max(0, file.hunks[hunkIdx]!.lines.length - MAX_VISIBLE)))
    if (ch === 'k' || key.upArrow) setScroll(s => Math.max(0, s - 1))
    if (ch === 'n') { setHunkIdx(h => Math.min(h + 1, hunkCount - 1)); setScroll(0) }
    if (ch === 'p') { setHunkIdx(h => Math.max(0, h - 1)); setScroll(0) }
    if (ch === 's') {
      setHunkStatuses(prev => {
        const next = prev.map(f => [...f])
        next[fileIdx]![hunkIdx] = 'staged'
        return next
      })
    }
    if (ch === 'x') {
      setHunkStatuses(prev => {
        const next = prev.map(f => [...f])
        next[fileIdx]![hunkIdx] = 'skipped'
        return next
      })
    }
    if (ch === 't') setShowTree(t => !t)
  })

  if (!ready) return <Box />

  const hunk = file.hunks[hunkIdx]!
  const visible = hunk.lines.slice(scroll, scroll + MAX_VISIBLE)
  const totalStaged = hunkStatuses.flat().filter(s => s === 'staged').length
  const totalHunks = hunkStatuses.flat().length

  const statusIcon = (s: string) => {
    if (s === 'added') return { ch: 'A', color: colors.success }
    if (s === 'deleted') return { ch: 'D', color: colors.error }
    if (s === 'renamed') return { ch: 'R', color: colors.info }
    return { ch: 'M', color: colors.warning }
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Text bold color={colors.primary}>Git Diff</Text>
          <Text dimColor>—</Text>
          <Text dimColor>{totalStaged}/{totalHunks} hunks staged</Text>
        </Box>
        <Box gap={1}>
          <Text dimColor>{FILES.reduce((s, f) => s + f.additions, 0)} additions, {FILES.reduce((s, f) => s + f.deletions, 0)} deletions</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>{'─'.repeat(68)}</Text>
      </Box>

      <Box marginTop={1} gap={1}>
        {/* File tree */}
        {showTree && (
          <Box flexDirection="column" width={22}>
            <Text bold dimColor>Files</Text>
            <Box marginTop={1} flexDirection="column">
              {FILES.map((f, i) => {
                const si = statusIcon(f.status)
                const active = i === fileIdx
                const fileStaged = hunkStatuses[i]!.every(s => s === 'staged')
                const fileSkipped = hunkStatuses[i]!.every(s => s === 'skipped')
                return (
                  <Box key={f.path} gap={1}>
                    <Text color={si.color} bold>{si.ch}</Text>
                    <Text
                      bold={active}
                      color={active ? colors.primary : fileStaged ? colors.success : fileSkipped ? undefined : undefined}
                      dimColor={!active && !fileStaged}
                      strikethrough={fileSkipped}
                    >
                      {f.path.split('/').pop()}
                    </Text>
                    {fileStaged && <Text color={colors.success}>✓</Text>}
                  </Box>
                )
              })}
            </Box>

            <Box marginTop={1}>
              <Text dimColor>{'─'.repeat(20)}</Text>
            </Box>

            {/* Hunk list for current file */}
            <Box marginTop={1} flexDirection="column">
              <Text bold dimColor>Hunks</Text>
              <Box marginTop={1} flexDirection="column">
                {file.hunks.map((h, hi) => {
                  const hs = statuses[hi]!
                  const active = hi === hunkIdx
                  return (
                    <Box key={hi} gap={1}>
                      <Text color={active ? colors.primary : undefined} bold={active}>
                        {active ? '▸' : ' '}
                      </Text>
                      <Text
                        dimColor={!active}
                        color={hs === 'staged' ? colors.success : hs === 'skipped' ? colors.error : undefined}
                      >
                        {h.header}
                      </Text>
                      {hs === 'staged' && <Text color={colors.success}>✓</Text>}
                      {hs === 'skipped' && <Text color={colors.error}>✗</Text>}
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>
        )}

        {/* Divider */}
        {showTree && (
          <Box flexDirection="column">
            {Array.from({ length: MAX_VISIBLE + 4 }).map((_, i) => (
              <Text key={i} dimColor>│</Text>
            ))}
          </Box>
        )}

        {/* Diff content */}
        <Box flexDirection="column" flexGrow={1}>
          {/* File + hunk header */}
          <Box gap={1}>
            <Text color={statusIcon(file.status).color} bold>{statusIcon(file.status).ch}</Text>
            <Text bold>{file.path}</Text>
            <Text dimColor>hunk {hunkIdx + 1}/{hunkCount}</Text>
            {statuses[hunkIdx] === 'staged' && <Text color={colors.success} bold inverse> STAGED </Text>}
            {statuses[hunkIdx] === 'skipped' && <Text color={colors.error} inverse> SKIP </Text>}
          </Box>

          <Box marginTop={1}>
            <Text color={colors.info} dimColor>{hunk.header}</Text>
          </Box>

          {/* Diff lines */}
          <Box flexDirection="column" marginTop={1}>
            {visible.map((line, i) => {
              const isAdd = line.type === 'add'
              const isRemove = line.type === 'remove'
              const lineColor = isAdd ? colors.success : isRemove ? colors.error : undefined
              const prefix = isAdd ? '+' : isRemove ? '-' : ' '
              const oldG = line.oldNum != null ? String(line.oldNum).padStart(3) : '   '
              const newG = line.newNum != null ? String(line.newNum).padStart(3) : '   '

              return (
                <Box key={i + scroll}>
                  <Text dimColor>{oldG} {newG} </Text>
                  <Text color={lineColor} bold={isAdd || isRemove}>{prefix} </Text>
                  <Text color={lineColor} dimColor={line.type === 'context'}>{line.text}</Text>
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> f </Text><Text dimColor> file</Text></Box>
        <Box><Text inverse bold> n/p </Text><Text dimColor> hunk</Text></Box>
        <Box><Text inverse bold> s </Text><Text dimColor> stage</Text></Box>
        <Box><Text inverse bold> x </Text><Text dimColor> skip</Text></Box>
        <Box><Text inverse bold> t </Text><Text dimColor> tree</Text></Box>
        <Box><Text inverse bold> j/k </Text><Text dimColor> scroll</Text></Box>
      </Box>
    </Box>
  )
}
