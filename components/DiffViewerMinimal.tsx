import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

type LineType = 'add' | 'remove' | 'context' | 'separator'

interface DiffLine {
  type: LineType
  num?: number
  text: string
  wordHighlights?: { start: number; end: number }[]
}

interface Hunk {
  header: string
  lines: DiffLine[]
  collapsed: boolean
}

interface DiffFile {
  path: string
  additions: number
  deletions: number
  hunks: Hunk[]
}

/* ── Word diff highlight helper ── */

function highlightWord(text: string, highlights: { start: number; end: number }[] | undefined, baseColor: string, hlColor: string) {
  if (!highlights || highlights.length === 0) {
    return <Text color={baseColor}>{text}</Text>
  }

  const parts: React.ReactNode[] = []
  let last = 0
  for (const h of highlights) {
    if (h.start > last) {
      parts.push(<Text key={last} color={baseColor}>{text.slice(last, h.start)}</Text>)
    }
    parts.push(<Text key={h.start} color={hlColor} bold underline>{text.slice(h.start, h.end)}</Text>)
    last = h.end
  }
  if (last < text.length) {
    parts.push(<Text key={last} color={baseColor}>{text.slice(last)}</Text>)
  }
  return <>{parts}</>
}

/* ── Demo data ── */

const FILES: DiffFile[] = [
  {
    path: 'src/auth.ts',
    additions: 14,
    deletions: 3,
    hunks: [
      {
        header: '@@ -1,8 +1,19 @@',
        collapsed: false,
        lines: [
          { type: 'context', num: 1, text: "import jwt from 'jsonwebtoken'" },
          { type: 'remove', num: 2, text: "import { Request, Response } from 'express'", wordHighlights: [{ start: 18, end: 34 }] },
          { type: 'add', num: 2, text: "import { Request, Response, Next } from 'express'", wordHighlights: [{ start: 18, end: 40 }] },
          { type: 'add', num: 3, text: "import { JwtPayload } from './types'" },
          { type: 'context', num: 4, text: '' },
          { type: 'remove', num: 5, text: 'const SECRET = "my-secret"', wordHighlights: [{ start: 15, end: 26 }] },
          { type: 'add', num: 5, text: 'const SECRET = process.env.JWT_SECRET!', wordHighlights: [{ start: 15, end: 38 }] },
          { type: 'context', num: 6, text: '' },
          { type: 'remove', num: 7, text: 'export function verify(token: string) {', wordHighlights: [{ start: 16, end: 22 }] },
          { type: 'add', num: 7, text: 'export function verifyToken(token: string): JwtPayload {', wordHighlights: [{ start: 16, end: 27 }, { start: 43, end: 56 }] },
          { type: 'context', num: 8, text: '  return jwt.verify(token, SECRET) as JwtPayload' },
          { type: 'context', num: 9, text: '}' },
        ],
      },
      {
        header: '@@ +10,10 @@  (new)',
        collapsed: false,
        lines: [
          { type: 'add', num: 10, text: '' },
          { type: 'add', num: 11, text: 'export function requireAuth(req: Request, res: Response, next: Next) {' },
          { type: 'add', num: 12, text: '  const header = req.headers.authorization' },
          { type: 'add', num: 13, text: "  if (!header) return res.status(401).json({ error: 'Unauthorized' })" },
          { type: 'add', num: 14, text: '  try {' },
          { type: 'add', num: 15, text: "    req.user = verifyToken(header.slice(7))" },
          { type: 'add', num: 16, text: '    next()' },
          { type: 'add', num: 17, text: '  } catch {' },
          { type: 'add', num: 18, text: "    res.status(401).json({ error: 'Invalid token' })" },
          { type: 'add', num: 19, text: '  }' },
          { type: 'add', num: 20, text: '}' },
        ],
      },
    ],
  },
  {
    path: 'src/routes.ts',
    additions: 5,
    deletions: 2,
    hunks: [
      {
        header: '@@ -1,10 +1,12 @@',
        collapsed: false,
        lines: [
          { type: 'context', num: 1, text: "import express from 'express'" },
          { type: 'context', num: 2, text: "import { userCtrl } from './controllers'" },
          { type: 'remove', num: 3, text: '// TODO: add auth' },
          { type: 'add', num: 3, text: "import { requireAuth } from './auth'" },
          { type: 'context', num: 4, text: '' },
          { type: 'context', num: 5, text: 'const router = express.Router()' },
          { type: 'context', num: 6, text: '' },
          { type: 'remove', num: 7, text: "router.get('/users', userCtrl.list)", wordHighlights: [{ start: 20, end: 34 }] },
          { type: 'add', num: 7, text: "router.get('/users', requireAuth, userCtrl.list)", wordHighlights: [{ start: 20, end: 48 }] },
          { type: 'add', num: 8, text: "router.post('/users', requireAuth, userCtrl.create)" },
          { type: 'add', num: 9, text: "router.delete('/users/:id', requireAuth, userCtrl.remove)" },
          { type: 'context', num: 10, text: '' },
          { type: 'context', num: 11, text: 'export default router' },
        ],
      },
    ],
  },
]

const MAX_VISIBLE = 20

/* ── Main ── */

export function DiffViewerMinimal() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [fileIdx, setFileIdx] = useState(0)
  const [scroll, setScroll] = useState(0)
  const [hunks, setHunks] = useState<boolean[][]>(() => FILES.map(f => f.hunks.map(() => false)))

  const file = FILES[fileIdx]!
  const fileHunkStates = hunks[fileIdx]!

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) { stdout.write('\x1b[2J\x1b[H'); setReady(true) }
    }, 300)
    return () => { mountedRef.current = false; clearTimeout(id) }
  }, [])

  useEffect(() => { setScroll(0) }, [fileIdx])

  // Build visible lines
  const allLines: { type: 'hunk-header'; hunkIdx: number; text: string; collapsed: boolean }[] | { type: 'line'; line: DiffLine }[] = []
  const flatLines: any[] = []
  file.hunks.forEach((hunk, hi) => {
    flatLines.push({ kind: 'hunk-header', hunkIdx: hi, text: hunk.header, collapsed: fileHunkStates[hi] })
    if (!fileHunkStates[hi]) {
      for (const line of hunk.lines) {
        flatLines.push({ kind: 'line', line })
      }
    }
  })

  const visibleFlat = flatLines.slice(scroll, scroll + MAX_VISIBLE)

  useInput((ch, key) => {
    if (key.tab || ch === 'f') setFileIdx(i => (i + 1) % FILES.length)
    if (ch === 'j' || key.downArrow) setScroll(s => Math.min(s + 1, Math.max(0, flatLines.length - MAX_VISIBLE)))
    if (ch === 'k' || key.upArrow) setScroll(s => Math.max(0, s - 1))
    if (ch === 'c') {
      // Collapse/expand all hunks
      setHunks(prev => {
        const next = prev.map(f => [...f])
        const allCollapsed = next[fileIdx]!.every(Boolean)
        next[fileIdx] = next[fileIdx]!.map(() => !allCollapsed)
        return next
      })
    }
  })

  if (!ready) return <Box />

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box justifyContent="space-between">
        <Text bold color={colors.primary}>Unified Diff</Text>
        <Box gap={1}>
          <Text color={colors.success}>+{file.additions}</Text>
          <Text color={colors.error}>-{file.deletions}</Text>
        </Box>
      </Box>

      {/* File tabs */}
      <Box gap={2} marginTop={1} marginBottom={1}>
        {FILES.map((f, i) => {
          const active = i === fileIdx
          return (
            <Text key={f.path} bold={active} color={active ? colors.primary : undefined} dimColor={!active} underline={active}>
              {f.path}
            </Text>
          )
        })}
      </Box>

      <Text dimColor>{'─'.repeat(68)}</Text>

      {/* Lines */}
      <Box flexDirection="column" marginTop={1}>
        {visibleFlat.map((item: any, i: number) => {
          if (item.kind === 'hunk-header') {
            return (
              <Box key={`h${item.hunkIdx}`} marginTop={i > 0 ? 1 : 0} marginBottom={0}>
                <Text color={colors.info} dimColor>
                  {item.collapsed ? '▸' : '▾'} {item.text}
                </Text>
              </Box>
            )
          }

          const line = item.line as DiffLine
          const isAdd = line.type === 'add'
          const isRemove = line.type === 'remove'
          const lineColor = isAdd ? colors.success : isRemove ? colors.error : undefined
          const prefix = isAdd ? '+' : isRemove ? '-' : ' '
          const num = line.num != null ? String(line.num).padStart(4) : '    '

          // Word-level highlights
          const hlColor = isAdd ? '#88ffaa' : isRemove ? '#ff8888' : colors.primary

          return (
            <Box key={`l${i + scroll}`}>
              <Text dimColor>{num} </Text>
              <Text color={lineColor} bold={isAdd || isRemove}>{prefix} </Text>
              {line.wordHighlights && line.wordHighlights.length > 0
                ? highlightWord(line.text, line.wordHighlights, lineColor ?? 'gray', hlColor)
                : <Text color={lineColor} dimColor={line.type === 'context'}>{line.text}</Text>
              }
            </Box>
          )
        })}
      </Box>

      {/* Scroll */}
      {flatLines.length > MAX_VISIBLE && (
        <Box marginTop={1}>
          <Text dimColor>{scroll + 1}–{Math.min(scroll + MAX_VISIBLE, flatLines.length)} of {flatLines.length}</Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> f </Text><Text dimColor> file</Text></Box>
        <Box><Text inverse bold> j/k </Text><Text dimColor> scroll</Text></Box>
        <Box><Text inverse bold> c </Text><Text dimColor> collapse</Text></Box>
      </Box>
    </Box>
  )
}
