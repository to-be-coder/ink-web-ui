import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

type PartStatus = 'hidden' | 'active' | 'done'

interface ThinkingPart {
  type: 'thinking'
  lines: string[]
  status: PartStatus
}

interface ToolPart {
  type: 'tool'
  tool: string
  input: string
  output: string
  status: PartStatus
}

interface TextPart {
  type: 'text'
  text: string
  status: PartStatus
  charIndex: number // for streaming
}

interface CodePart {
  type: 'code'
  file: string
  lang: string
  code: string
  status: PartStatus
}

type Part = ThinkingPart | ToolPart | TextPart | CodePart

interface UserMsg { role: 'user'; text: string; time: string }
interface AssistantMsg { role: 'assistant'; parts: Part[]; model: string; tokens: number; time: string; cost: string }
type Message = UserMsg | AssistantMsg

/* ── Spinner ── */

const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const DOTS = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']

/* ── Initial conversation ── */

function initialMessages(): Message[] {
  return [
    {
      role: 'user',
      text: 'Add authentication to my Express API with JWT tokens',
      time: '2:14 PM',
    },
    {
      role: 'assistant', model: 'claude opus', tokens: 0, time: '2:14 PM', cost: '$0.00',
      parts: [
        {
          type: 'thinking', status: 'hidden',
          lines: [
            'The user wants JWT authentication for Express.',
            'I should first check the project structure and existing deps.',
            'Then create auth middleware with passport-jwt strategy.',
            'Need to handle: token generation, verification, protected routes.',
          ],
        },
        { type: 'tool', tool: 'Read', input: 'package.json', output: 'express@4.18, typescript@5.3 — no auth packages', status: 'hidden' },
        { type: 'tool', tool: 'Read', input: 'src/app.ts', output: '42 lines — Express app, 3 routes, no middleware', status: 'hidden' },
        { type: 'tool', tool: 'Search', input: '"auth" in src/**/*.ts', output: '0 results', status: 'hidden' },
        {
          type: 'text', status: 'hidden', charIndex: 0,
          text: "I'll set up JWT authentication with a clean middleware pattern. No existing auth found, so we're starting fresh.",
        },
        {
          type: 'code', status: 'hidden', file: 'src/middleware/auth.ts', lang: 'typescript',
          code: `import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

const SECRET = process.env.JWT_SECRET!

interface TokenPayload {
  userId: string
  email: string
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }
  try {
    req.user = verifyToken(header.slice(7))
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}`,
        },
        {
          type: 'text', status: 'hidden', charIndex: 0,
          text: "Created the auth middleware. Now I'll wire it into your routes and add a login endpoint.",
        },
        { type: 'tool', tool: 'Edit', input: 'src/app.ts — added requireAuth to protected routes', output: '3 lines changed', status: 'hidden' },
        { type: 'tool', tool: 'Write', input: 'src/routes/auth.ts — login + register endpoints', output: 'created (34 lines)', status: 'hidden' },
        {
          type: 'text', status: 'hidden', charIndex: 0,
          text: "Done. Install jsonwebtoken and add JWT_SECRET to your .env. All /api routes now require a valid Bearer token.",
        },
      ],
    },
    {
      role: 'user',
      text: 'Can you also add refresh tokens?',
      time: '2:16 PM',
    },
    {
      role: 'assistant', model: 'claude opus', tokens: 0, time: '2:16 PM', cost: '$0.00',
      parts: [
        {
          type: 'thinking', status: 'hidden',
          lines: [
            'Refresh tokens need a separate long-lived token.',
            'Store refresh tokens server-side for revocation.',
            'Add /auth/refresh endpoint to rotate tokens.',
          ],
        },
        { type: 'tool', tool: 'Read', input: 'src/routes/auth.ts', output: '34 lines — login/register endpoints', status: 'hidden' },
        { type: 'tool', tool: 'Edit', input: 'src/routes/auth.ts — added refresh endpoint', output: '18 lines added', status: 'hidden' },
        { type: 'tool', tool: 'Edit', input: 'src/middleware/auth.ts — added generateTokenPair()', output: '12 lines added', status: 'hidden' },
        {
          type: 'text', status: 'hidden', charIndex: 0,
          text: 'Added refresh token support. Access tokens expire in 15 minutes, refresh tokens in 7 days. Call POST /auth/refresh with your refresh token to get a new pair.',
        },
      ],
    },
  ]
}

/* ── Tool color map ── */

function toolColor(tool: string, colors: ReturnType<typeof useTheme>): string {
  switch (tool) {
    case 'Read': return colors.info
    case 'Search': return colors.secondary
    case 'Edit': return colors.success
    case 'Write': return colors.primary
    case 'Bash': return colors.warning
    default: return colors.info
  }
}

/* ── Syntax coloring ── */

const KW = new Set(['import', 'export', 'from', 'const', 'let', 'return', 'new', 'function', 'if', 'else', 'try', 'catch', 'interface', 'type'])

function colorCode(line: string, colors: ReturnType<typeof useTheme>) {
  const tokens = line.split(/(\s+|[{}().,;:=!?<>|&]|'[^']*'|"[^"]*"|`[^`]*`)/)
  return (
    <Text>
      {tokens.map((t, i) => {
        if (KW.has(t)) return <Text key={i} color={colors.primary}>{t}</Text>
        if (/^['"`]/.test(t)) return <Text key={i} color={colors.success}>{t}</Text>
        if (/^\/\//.test(t)) return <Text key={i} dimColor>{t}</Text>
        return <Text key={i}>{t}</Text>
      })}
    </Text>
  )
}

function formatInlineCode(text: string, colors: ReturnType<typeof useTheme>) {
  const parts = text.split(/(`[^`]+`)/)
  return (
    <Text>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`')
          ? <Text key={i} color={colors.info}>{p.slice(1, -1)}</Text>
          : <Text key={i}>{p}</Text>
      )}
    </Text>
  )
}

/* ── Main ── */

export function ChatFlow() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [frame, setFrame] = useState(0)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [scroll, setScroll] = useState(0)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [animDone, setAnimDone] = useState(false)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) { stdout.write('\x1b[2J\x1b[H'); setReady(true) }
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

  // Progressive reveal animation
  useEffect(() => {
    if (!ready) return
    setMessages(initialMessages())
    setCollapsed(new Set())
    setAnimDone(false)
    setScroll(0)

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 400

    const msgs = initialMessages()
    // Flatten all assistant parts across all messages
    const steps: { msgIdx: number; partIdx: number }[] = []
    msgs.forEach((msg, mi) => {
      if (msg.role === 'assistant') {
        msg.parts.forEach((_, pi) => { steps.push({ msgIdx: mi, partIdx: pi }) })
      }
    })

    for (const step of steps) {
      const { msgIdx, partIdx } = step
      const part = (msgs[msgIdx] as AssistantMsg).parts[partIdx]!

      // Activate part
      timers.push(setTimeout(() => {
        if (!mountedRef.current) return
        setMessages(prev => {
          const next = JSON.parse(JSON.stringify(prev)) as Message[]
          const p = (next[msgIdx] as AssistantMsg).parts[partIdx]!
          p.status = 'active'
          return next
        })
      }, delay))

      // Duration based on part type
      let dur = 400
      if (part.type === 'thinking') dur = 1500
      else if (part.type === 'tool') dur = 600
      else if (part.type === 'text') dur = 800
      else if (part.type === 'code') dur = 1200

      // Stream text characters
      if (part.type === 'text') {
        const text = part.text
        const charsPerTick = 3
        const totalTicks = Math.ceil(text.length / charsPerTick)
        for (let t = 0; t <= totalTicks; t++) {
          timers.push(setTimeout(() => {
            if (!mountedRef.current) return
            setMessages(prev => {
              const next = JSON.parse(JSON.stringify(prev)) as Message[]
              const p = (next[msgIdx] as AssistantMsg).parts[partIdx] as TextPart
              p.charIndex = Math.min(t * charsPerTick, text.length)
              return next
            })
          }, delay + t * 30))
        }
        dur = Math.max(dur, totalTicks * 30 + 100)
      }

      // Complete part
      timers.push(setTimeout(() => {
        if (!mountedRef.current) return
        setMessages(prev => {
          const next = JSON.parse(JSON.stringify(prev)) as Message[]
          const p = (next[msgIdx] as AssistantMsg).parts[partIdx]!
          p.status = 'done'
          if (p.type === 'text') p.charIndex = p.text.length

          // Update token count
          const aMsg = next[msgIdx] as AssistantMsg
          const doneCount = aMsg.parts.filter(pp => pp.status === 'done').length
          aMsg.tokens = doneCount * 45 + Math.floor(Math.random() * 30)
          aMsg.cost = '$' + (aMsg.tokens * 0.000015).toFixed(4)
          return next
        })

        // Auto-collapse thinking and tools after completion
        if (part.type === 'thinking' || part.type === 'tool') {
          setTimeout(() => {
            if (!mountedRef.current) return
            setCollapsed(prev => new Set([...prev, `${msgIdx}:${partIdx}`]))
          }, 300)
        }
      }, delay + dur))

      delay += dur + 150
    }

    // Mark animation done
    timers.push(setTimeout(() => {
      if (mountedRef.current) setAnimDone(true)
    }, delay))

    return () => timers.forEach(clearTimeout)
  }, [ready, runId])

  useInput((ch, key) => {
    if (ch === 'j' || key.downArrow) setScroll(s => s + 1)
    if (ch === 'k' || key.upArrow) setScroll(s => Math.max(0, s - 1))
    if (ch === 'e') {
      // Expand/collapse all
      if (collapsed.size > 0) {
        setCollapsed(new Set())
      } else {
        const keys = new Set<string>()
        messages.forEach((msg, mi) => {
          if (msg.role === 'assistant') {
            msg.parts.forEach((p, pi) => {
              if ((p.type === 'thinking' || p.type === 'tool') && p.status === 'done') {
                keys.add(`${mi}:${pi}`)
              }
            })
          }
        })
        setCollapsed(keys)
      }
    }
    if (ch === 'r') setRunId(n => n + 1)
  })

  if (!ready) return <Box />

  const spin = SPIN[frame % SPIN.length]
  const dots = DOTS[frame % DOTS.length]
  const isColl = (mi: number, pi: number) => collapsed.has(`${mi}:${pi}`)

  // Count totals
  const totalTokens = messages.reduce((s, m) => s + (m.role === 'assistant' ? m.tokens : 0), 0)
  const isAnimating = !animDone

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Messages */}
      {messages.map((msg, mi) => {
        if (msg.role === 'user') {
          return (
            <Box key={mi} flexDirection="column" marginBottom={1}>
              <Box gap={1}>
                <Text dimColor>{msg.time}</Text>
                <Text bold>you</Text>
              </Box>
              <Box marginLeft={1}>
                <Text>{msg.text}</Text>
              </Box>
            </Box>
          )
        }

        // Assistant
        const aMsg = msg
        const visibleParts = aMsg.parts.filter(p => p.status !== 'hidden')
        if (visibleParts.length === 0 && mi > 0) return null

        const anyActive = aMsg.parts.some(p => p.status === 'active')

        return (
          <Box key={mi} flexDirection="column" marginBottom={1}>
            {/* Assistant header */}
            <Box gap={1}>
              <Text dimColor>{aMsg.time}</Text>
              <Text bold color={colors.primary}>assistant</Text>
              <Text dimColor>{aMsg.model}</Text>
              {anyActive && <Text color={colors.primary}>{spin}</Text>}
              {!anyActive && aMsg.tokens > 0 && <Text dimColor>· {aMsg.tokens}t · {aMsg.cost}</Text>}
            </Box>

            {/* Parts */}
            {aMsg.parts.map((part, pi) => {
              if (part.status === 'hidden') return null
              const coll = isColl(mi, pi)

              if (part.type === 'thinking') {
                return (
                  <Box key={pi} flexDirection="column" marginLeft={1} marginTop={pi === 0 ? 0 : 0}>
                    <Box gap={1}>
                      <Text color={colors.secondary}>
                        {part.status === 'active' ? dots : (coll ? '▸' : '▾')}
                      </Text>
                      <Text dimColor>
                        {part.status === 'active' ? 'Thinking…' : `Thought for ${part.lines.length} steps`}
                      </Text>
                    </Box>
                    {!coll && (
                      <Box flexDirection="column" marginLeft={3}>
                        {part.lines.map((line, li) => {
                          if (part.status === 'active') {
                            // Reveal lines progressively during active
                            const revealedLines = Math.min(Math.floor(frame / 4) + 1, part.lines.length)
                            if (li >= revealedLines) return null
                          }
                          return <Text key={li} dimColor>{'· ' + line}</Text>
                        })}
                      </Box>
                    )}
                  </Box>
                )
              }

              if (part.type === 'tool') {
                const tc = toolColor(part.tool, colors)
                return (
                  <Box key={pi} flexDirection="column" marginLeft={1}>
                    <Box gap={1}>
                      <Text color={part.status === 'active' ? tc : colors.success}>
                        {part.status === 'active' ? spin : '✓'}
                      </Text>
                      <Text color={tc} bold>{part.tool}</Text>
                      <Text dimColor>{part.input}</Text>
                    </Box>
                    {!coll && part.status === 'done' && (
                      <Box marginLeft={3}>
                        <Text dimColor>↳ {part.output}</Text>
                      </Box>
                    )}
                  </Box>
                )
              }

              if (part.type === 'text') {
                const displayText = part.status === 'active' ? part.text.slice(0, part.charIndex) : part.text
                const showCursor = part.status === 'active' && part.charIndex < part.text.length
                return (
                  <Box key={pi} marginLeft={1} marginTop={1}>
                    {formatInlineCode(displayText, colors)}
                    {showCursor && <Text color={colors.primary}>▎</Text>}
                  </Box>
                )
              }

              if (part.type === 'code') {
                const lines = part.code.split('\n')
                const isRevealing = part.status === 'active'
                const revealedLines = isRevealing ? Math.min(Math.floor(frame / 2) + 1, lines.length) : lines.length
                return (
                  <Box key={pi} flexDirection="column" marginLeft={1} marginTop={1}>
                    <Box gap={1}>
                      <Text color={colors.info} bold>{part.file}</Text>
                      <Text dimColor>{part.lang}</Text>
                    </Box>
                    <Box flexDirection="column" marginTop={0}>
                      {lines.slice(0, revealedLines).map((line, li) => (
                        <Box key={li}>
                          <Box width={4}>
                            <Text dimColor>{String(li + 1).padStart(3)} </Text>
                          </Box>
                          {colorCode(line, colors)}
                        </Box>
                      ))}
                      {isRevealing && revealedLines < lines.length && (
                        <Box>
                          <Box width={4}><Text dimColor>    </Text></Box>
                          <Text color={colors.primary}>{spin}</Text>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )
              }

              return null
            })}
          </Box>
        )
      })}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>{'─'.repeat(64)}</Text>
      </Box>
      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> j/k </Text><Text dimColor> scroll</Text></Box>
        <Box><Text inverse bold> e </Text><Text dimColor> {collapsed.size > 0 ? 'expand' : 'collapse'}</Text></Box>
        <Box><Text inverse bold> r </Text><Text dimColor> replay</Text></Box>
        {totalTokens > 0 && (
          <Box marginLeft={1}>
            <Text dimColor>{totalTokens} tokens</Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}
