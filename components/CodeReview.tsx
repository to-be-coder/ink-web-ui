import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

type Severity = 'critical' | 'warning' | 'suggestion' | 'praise'
type LineType = 'add' | 'remove' | 'context'

interface DiffLine {
  type: LineType
  num: number
  text: string
}

interface Annotation {
  line: number
  severity: Severity
  title: string
  body: string
  suggestion?: string
  status: 'pending' | 'accepted' | 'dismissed'
}

interface ReviewFile {
  path: string
  lang: string
  additions: number
  deletions: number
  lines: DiffLine[]
  annotations: Annotation[]
}

/* ── Demo data ── */

const FILES: ReviewFile[] = [
  {
    path: 'src/auth.ts',
    lang: 'TypeScript',
    additions: 14,
    deletions: 2,
    lines: [
      { type: 'context', num: 1, text: "import jwt from 'jsonwebtoken'" },
      { type: 'context', num: 2, text: "import { Request, Response, Next } from 'express'" },
      { type: 'context', num: 3, text: '' },
      { type: 'remove',  num: 4, text: 'const SECRET = "hardcoded-secret-key"' },
      { type: 'add',     num: 4, text: 'const SECRET = process.env.JWT_SECRET!' },
      { type: 'context', num: 5, text: '' },
      { type: 'context', num: 6, text: 'export function verifyToken(token: string) {' },
      { type: 'remove',  num: 7, text: '  return jwt.verify(token, SECRET) as any' },
      { type: 'add',     num: 7, text: '  return jwt.verify(token, SECRET) as JwtPayload' },
      { type: 'context', num: 8, text: '}' },
      { type: 'context', num: 9, text: '' },
      { type: 'add',     num: 10, text: 'export function requireAuth(req: Request, res: Response, next: Next) {' },
      { type: 'add',     num: 11, text: '  const header = req.headers.authorization' },
      { type: 'add',     num: 12, text: "  if (!header) return res.status(401).json({ error: 'Missing token' })" },
      { type: 'add',     num: 13, text: '  try {' },
      { type: 'add',     num: 14, text: "    req.user = verifyToken(header.replace('Bearer ', ''))" },
      { type: 'add',     num: 15, text: '    next()' },
      { type: 'add',     num: 16, text: '  } catch {' },
      { type: 'add',     num: 17, text: "    res.status(401).json({ error: 'Invalid token' })" },
      { type: 'add',     num: 18, text: '  }' },
      { type: 'add',     num: 19, text: '}' },
    ],
    annotations: [
      {
        line: 4,
        severity: 'critical',
        title: 'Missing env validation',
        body: 'Non-null assertion on JWT_SECRET will throw at runtime if the env var is missing. Validate at startup.',
        suggestion: "const SECRET = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET required') })()",
        status: 'pending',
      },
      {
        line: 7,
        severity: 'praise',
        title: 'Good type improvement',
        body: 'Replacing `any` with `JwtPayload` improves type safety.',
        status: 'pending',
      },
      {
        line: 12,
        severity: 'warning',
        title: 'Leaking internal details',
        body: "Returning 'Missing token' tells attackers what's expected. Use a generic message.",
        suggestion: "  if (!header) return res.status(401).json({ error: 'Unauthorized' })",
        status: 'pending',
      },
      {
        line: 14,
        severity: 'suggestion',
        title: 'Prefix stripping fragile',
        body: "If the header doesn't start with 'Bearer ', the replace is a no-op and verify will fail silently.",
        suggestion: "    const token = header.startsWith('Bearer ') ? header.slice(7) : header",
        status: 'pending',
      },
    ],
  },
  {
    path: 'src/routes.ts',
    lang: 'TypeScript',
    additions: 6,
    deletions: 1,
    lines: [
      { type: 'context', num: 1, text: "import express from 'express'" },
      { type: 'context', num: 2, text: "import { userController } from './controllers'" },
      { type: 'remove',  num: 3, text: "// TODO: add auth" },
      { type: 'add',     num: 3, text: "import { requireAuth } from './auth'" },
      { type: 'add',     num: 4, text: '' },
      { type: 'context', num: 5, text: 'const router = express.Router()' },
      { type: 'context', num: 6, text: '' },
      { type: 'context', num: 7, text: "router.get('/health', (req, res) => {" },
      { type: 'context', num: 8, text: "  res.json({ status: 'ok' })" },
      { type: 'context', num: 9, text: '})' },
      { type: 'context', num: 10, text: '' },
      { type: 'add',     num: 11, text: "router.use('/api', requireAuth)" },
      { type: 'add',     num: 12, text: '' },
      { type: 'context', num: 13, text: "router.get('/api/users', userController.list)" },
      { type: 'context', num: 14, text: "router.post('/api/users', userController.create)" },
      { type: 'add',     num: 15, text: "router.delete('/api/users/:id', requireAuth, userController.remove)" },
      { type: 'context', num: 16, text: '' },
      { type: 'context', num: 17, text: 'export default router' },
    ],
    annotations: [
      {
        line: 11,
        severity: 'warning',
        title: 'Auth middleware ordering',
        body: "router.use applies to routes defined after it. The /health endpoint is correctly unprotected, but verify this is intentional.",
        status: 'pending',
      },
      {
        line: 15,
        severity: 'suggestion',
        title: 'Redundant auth guard',
        body: "requireAuth is already applied via router.use on line 11. The inline guard on delete is redundant.",
        suggestion: "router.delete('/api/users/:id', userController.remove)",
        status: 'pending',
      },
    ],
  },
]

/* ── Severity config ── */

function useSeverityConfig() {
  const colors = useTheme()
  return {
    critical:   { icon: '✖', color: colors.error,     label: 'CRITICAL' },
    warning:    { icon: '▲', color: colors.warning,    label: 'WARNING' },
    suggestion: { icon: '◆', color: colors.info,       label: 'SUGGESTION' },
    praise:     { icon: '★', color: colors.success,    label: 'GOOD' },
  }
}

/* ── Annotation rendering ── */

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/* ── Main ── */

export function CodeReview() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const severity = useSeverityConfig()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [fileIdx, setFileIdx] = useState(0)
  const [cursor, setCursor] = useState(0)
  const [scroll, setScroll] = useState(0)
  const [frame, setFrame] = useState(0)
  const [reviewPhase, setReviewPhase] = useState<'scanning' | 'reviewing' | 'done'>('scanning')
  const [visibleAnnotations, setVisibleAnnotations] = useState(0)
  const [annotations, setAnnotations] = useState<Annotation[][]>(() => FILES.map(f => f.annotations.map(a => ({ ...a }))))

  const file = FILES[fileIdx]!
  const fileAnnotations = annotations[fileIdx]!
  const shownAnnotations = fileAnnotations.slice(0, visibleAnnotations)
  const MAX_VISIBLE = 16

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) {
        stdout.write('\x1b[2J\x1b[H')
        setReady(true)
      }
    }, 300)
    return () => { mountedRef.current = false; clearTimeout(id) }
  }, [])

  // Spinner
  useEffect(() => {
    if (!ready) return
    const id = setInterval(() => {
      if (mountedRef.current) setFrame(f => f + 1)
    }, 80)
    return () => clearInterval(id)
  }, [ready])

  // Review animation: scanning → reveal annotations one by one → done
  useEffect(() => {
    if (!ready) return
    const timers: ReturnType<typeof setTimeout>[] = []

    // Scanning phase
    timers.push(setTimeout(() => {
      if (mountedRef.current) setReviewPhase('reviewing')
    }, 1200))

    // Reveal annotations
    const total = fileAnnotations.length
    for (let i = 0; i < total; i++) {
      timers.push(setTimeout(() => {
        if (mountedRef.current) setVisibleAnnotations(i + 1)
      }, 1800 + i * 700))
    }

    // Done
    timers.push(setTimeout(() => {
      if (mountedRef.current) setReviewPhase('done')
    }, 1800 + total * 700 + 400))

    return () => timers.forEach(clearTimeout)
  }, [ready, fileIdx])

  // Reset on file change
  useEffect(() => {
    setCursor(0)
    setScroll(0)
    setVisibleAnnotations(0)
    setReviewPhase('scanning')
  }, [fileIdx])

  useInput((ch, key) => {
    if (key.tab || ch === 'f') {
      setFileIdx(i => (i + 1) % FILES.length)
    }
    if (ch === 'j' || key.downArrow) {
      if (reviewPhase === 'done' && shownAnnotations.length > 0) {
        setCursor(c => Math.min(c + 1, shownAnnotations.length - 1))
      }
      setScroll(s => Math.min(s + 1, Math.max(0, file.lines.length - MAX_VISIBLE)))
    }
    if (ch === 'k' || key.upArrow) {
      if (reviewPhase === 'done' && shownAnnotations.length > 0) {
        setCursor(c => Math.max(0, c - 1))
      }
      setScroll(s => Math.max(0, s - 1))
    }
    if (ch === 'a' && reviewPhase === 'done' && shownAnnotations.length > 0) {
      setAnnotations(prev => {
        const next = prev.map(f => f.map(a => ({ ...a })))
        const ann = next[fileIdx]![cursor]
        if (ann) ann.status = 'accepted'
        return next
      })
    }
    if (ch === 'x' && reviewPhase === 'done' && shownAnnotations.length > 0) {
      setAnnotations(prev => {
        const next = prev.map(f => f.map(a => ({ ...a })))
        const ann = next[fileIdx]![cursor]
        if (ann) ann.status = 'dismissed'
        return next
      })
    }
  })

  if (!ready) return <Box />

  const totalAnnotations = annotations.flat()
  const accepted = totalAnnotations.filter(a => a.status === 'accepted').length
  const dismissed = totalAnnotations.filter(a => a.status === 'dismissed').length
  const pending = totalAnnotations.filter(a => a.status === 'pending').length
  const criticalCount = totalAnnotations.filter(a => a.severity === 'critical').length
  const warnCount = totalAnnotations.filter(a => a.severity === 'warning').length

  // Build line-annotation map for inline display
  const annotationsByLine = new Map<number, Annotation[]>()
  for (const ann of shownAnnotations) {
    const list = annotationsByLine.get(ann.line) ?? []
    list.push(ann)
    annotationsByLine.set(ann.line, list)
  }

  const visibleLines = file.lines.slice(scroll, scroll + MAX_VISIBLE)

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Text bold color={colors.primary}>AI Code Review</Text>
          {reviewPhase === 'scanning' && (
            <Text color={colors.info}>{SPINNER[frame % SPINNER.length]} scanning…</Text>
          )}
          {reviewPhase === 'reviewing' && (
            <Text color={colors.warning}>{SPINNER[frame % SPINNER.length]} reviewing…</Text>
          )}
          {reviewPhase === 'done' && (
            <Text color={colors.success}>✓ complete</Text>
          )}
        </Box>
        <Box gap={1}>
          {criticalCount > 0 && <Text color={colors.error} bold>{criticalCount} critical</Text>}
          {warnCount > 0 && <Text color={colors.warning}>{warnCount} warn</Text>}
          <Text dimColor>{accepted}✓ {dismissed}✗ {pending}◆</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>{'─'.repeat(64)}</Text>
      </Box>

      {/* File tabs */}
      <Box gap={2} marginTop={1}>
        {FILES.map((f, i) => (
          <Box key={f.path} gap={1}>
            <Text
              bold={i === fileIdx}
              color={i === fileIdx ? colors.primary : undefined}
              dimColor={i !== fileIdx}
              underline={i === fileIdx}
            >
              {f.path}
            </Text>
            <Text color={colors.success} dimColor={i !== fileIdx}>+{f.additions}</Text>
            <Text color={colors.error} dimColor={i !== fileIdx}>-{f.deletions}</Text>
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>{'─'.repeat(64)}</Text>
      </Box>

      {/* Diff + inline annotations */}
      <Box flexDirection="column" marginTop={1}>
        {visibleLines.map((line, vi) => {
          const lineColor = line.type === 'add' ? colors.success : line.type === 'remove' ? colors.error : undefined
          const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '
          const bgDim = line.type === 'context'
          const lineAnns = annotationsByLine.get(line.num)

          return (
            <Box key={vi + scroll} flexDirection="column">
              {/* Code line */}
              <Box>
                <Box width={5}>
                  <Text dimColor>{String(line.num).padStart(4)} </Text>
                </Box>
                <Box width={2}>
                  <Text color={lineColor} bold>{prefix}</Text>
                </Box>
                <Text color={lineColor} dimColor={bgDim}>
                  {line.text}
                </Text>
              </Box>

              {/* Inline annotations */}
              {lineAnns && lineAnns.map((ann, ai) => {
                const sev = severity[ann.severity]
                const annIdx = shownAnnotations.indexOf(ann)
                const isFocused = reviewPhase === 'done' && annIdx === cursor

                return (
                  <Box key={ai} flexDirection="column" marginLeft={5} marginBottom={1}>
                    {/* Annotation header */}
                    <Box gap={1}>
                      <Text color={sev.color}>{'│'}</Text>
                      {isFocused && <Text color={colors.primary} bold>▸</Text>}
                      <Text color={sev.color} bold>{sev.icon}</Text>
                      <Text color={sev.color} bold inverse> {sev.label} </Text>
                      <Text bold>{ann.title}</Text>
                      {ann.status === 'accepted' && <Text color={colors.success}> ✓ accepted</Text>}
                      {ann.status === 'dismissed' && <Text color={colors.error} dimColor> ✗ dismissed</Text>}
                    </Box>

                    {/* Annotation body */}
                    <Box>
                      <Text color={sev.color}>{'│'}</Text>
                      <Text dimColor> {ann.body}</Text>
                    </Box>

                    {/* Suggestion */}
                    {ann.suggestion && (
                      <Box flexDirection="column">
                        <Box>
                          <Text color={sev.color}>{'│'}</Text>
                          <Text dimColor> suggestion:</Text>
                        </Box>
                        <Box>
                          <Text color={sev.color}>{'│'}</Text>
                          <Text color={colors.success}>   + {ann.suggestion}</Text>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          )
        })}
      </Box>

      {/* Scroll indicator */}
      {file.lines.length > MAX_VISIBLE && (
        <Box marginTop={1}>
          <Text dimColor>
            lines {scroll + 1}–{Math.min(scroll + MAX_VISIBLE, file.lines.length)} of {file.lines.length}
          </Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> f </Text><Text dimColor> file</Text></Box>
        <Box><Text inverse bold> j/k </Text><Text dimColor> navigate</Text></Box>
        {reviewPhase === 'done' && (
          <>
            <Box><Text inverse bold> a </Text><Text dimColor> accept</Text></Box>
            <Box><Text inverse bold> x </Text><Text dimColor> dismiss</Text></Box>
          </>
        )}
      </Box>
    </Box>
  )
}
