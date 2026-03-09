import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { SPIN, Help } from './utils'

/* ── Part Types ── */

type Part =
  | { type: 'reasoning'; text: string; duration: string; status: 'streaming' | 'done' }
  | { type: 'tool-call'; tool: string; input: string; output?: string; status: 'running' | 'done' | 'error' }
  | { type: 'text'; text: string }
  | { type: 'code'; lang: string; code: string; file?: string }
  | { type: 'source'; title: string; index: number }

type Message =
  | { id: string; role: 'user'; text: string; timestamp: string }
  | { id: string; role: 'assistant'; parts: Part[]; timestamp: string; model?: string; tokens?: number }

/* ── Demo Data ── */

const THREAD: Message[] = [
  {
    id: '1', role: 'user',
    text: 'Add JWT authentication to my Express app',
    timestamp: '10:24 AM',
  },
  {
    id: '2', role: 'assistant', timestamp: '10:24 AM', model: 'opus-4', tokens: 342,
    parts: [
      { type: 'reasoning', text: 'The user wants JWT auth added to an Express app.\nI should check the existing project structure first,\nthen look for any existing auth setup before writing new code.\nI\'ll use passport.js with the JWT strategy.', duration: '4s', status: 'done' },
      { type: 'tool-call', tool: 'Read', input: 'src/app.ts', output: '38 lines — Express app with 3 routes, no auth', status: 'done' },
      { type: 'tool-call', tool: 'Search', input: '"auth" in src/**', output: '0 matches', status: 'done' },
      { type: 'tool-call', tool: 'Read', input: 'package.json', output: 'express@4.18, no auth packages installed', status: 'done' },
      { type: 'text', text: "I'll add JWT authentication using `passport.js` with the JWT strategy. Here's the auth middleware:" },
      { type: 'code', lang: 'ts', file: 'src/auth.ts', code: "import passport from 'passport'\nimport { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'\n\nconst opts = {\n  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),\n  secretOrKey: process.env.JWT_SECRET,\n}\n\npassport.use(new JwtStrategy(opts, (payload, done) => {\n  return done(null, payload)\n}))\n\nexport const requireAuth = passport.authenticate('jwt', { session: false })" },
      { type: 'text', text: 'Install the dependencies and add the middleware to your protected routes.' },
      { type: 'source', title: 'Passport.js JWT Strategy docs', index: 1 },
      { type: 'source', title: 'Express middleware patterns', index: 2 },
    ],
  },
  {
    id: '3', role: 'user',
    text: 'Can you also add rate limiting?',
    timestamp: '10:26 AM',
  },
  {
    id: '4', role: 'assistant', timestamp: '10:26 AM', model: 'opus-4', tokens: 187,
    parts: [
      { type: 'reasoning', text: 'Rate limiting is straightforward with express-rate-limit.\nI should add it as middleware before the auth routes.', duration: '2s', status: 'done' },
      { type: 'tool-call', tool: 'Read', input: 'src/app.ts', output: '42 lines — updated with auth middleware', status: 'done' },
      { type: 'text', text: "I'll add rate limiting using `express-rate-limit`:" },
      { type: 'code', lang: 'ts', file: 'src/app.ts', code: "import rateLimit from 'express-rate-limit'\n\nconst limiter = rateLimit({\n  windowMs: 15 * 60 * 1000, // 15 min\n  max: 100,\n  message: 'Too many requests',\n})\n\napp.use('/api', limiter)" },
      { type: 'text', text: 'This limits each IP to 100 requests per 15 minutes on `/api` routes.' },
    ],
  },
]

/* ── Flat cursor helpers ── */

interface FocusItem {
  msgIdx: number
  partIdx?: number
}

function buildFocusList(messages: Message[]): FocusItem[] {
  const items: FocusItem[] = []
  messages.forEach((msg, mi) => {
    if (msg.role === 'user') {
      items.push({ msgIdx: mi })
    } else {
      msg.parts.forEach((_, pi) => {
        items.push({ msgIdx: mi, partIdx: pi })
      })
    }
  })
  return items
}

/* ── Tool colors ── */

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

/* ── Component ── */

export function NewAIChatThreadV3() {
  const colors = useTheme()
  const [frame, setFrame] = useState(0)
  const [cursor, setCursor] = useState(0)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const mountedRef = useRef(true)

  const focusList = buildFocusList(THREAD)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const hasActive = THREAD.some(m => m.role === 'assistant' && m.parts.some(p =>
    (p.type === 'reasoning' && p.status === 'streaming') || (p.type === 'tool-call' && p.status === 'running')
  ))

  useEffect(() => {
    if (!hasActive) return
    const id = setInterval(() => {
      if (mountedRef.current) setFrame(f => f + 1)
    }, 80)
    return () => clearInterval(id)
  }, [hasActive])

  // Auto-collapse reasoning and tool-calls
  useEffect(() => {
    const keys = new Set<string>()
    THREAD.forEach((msg, mi) => {
      if (msg.role === 'assistant') {
        msg.parts.forEach((part, pi) => {
          if (part.type === 'reasoning' && part.status === 'done') keys.add(`${mi}:${pi}`)
          if (part.type === 'tool-call' && part.status === 'done') keys.add(`${mi}:${pi}`)
        })
      }
    })
    setCollapsed(keys)
  }, [])

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(focusList.length - 1, c + 1))
    if (key.return || ch === ' ') {
      const item = focusList[cursor]
      if (item && item.partIdx !== undefined) {
        const msg = THREAD[item.msgIdx]
        if (msg?.role === 'assistant') {
          const part = msg.parts[item.partIdx]
          if (part && (part.type === 'reasoning' || part.type === 'tool-call')) {
            const k = `${item.msgIdx}:${item.partIdx}`
            setCollapsed(prev => {
              const next = new Set(prev)
              if (next.has(k)) next.delete(k)
              else next.add(k)
              return next
            })
          }
        }
      }
    }
  })

  const isCollapsed = (mi: number, pi: number) => collapsed.has(`${mi}:${pi}`)
  const spin = SPIN[frame % SPIN.length]

  // Group focus items by message for rendering
  const msgGroups: { msgIdx: number; items: { fi: number; partIdx?: number }[] }[] = []
  focusList.forEach((item, fi) => {
    const last = msgGroups[msgGroups.length - 1]
    if (last && last.msgIdx === item.msgIdx) {
      last.items.push({ fi, partIdx: item.partIdx })
    } else {
      msgGroups.push({ msgIdx: item.msgIdx, items: [{ fi, partIdx: item.partIdx }] })
    }
  })

  const totalTokens = THREAD.reduce((s, m) => s + (m.role === 'assistant' ? (m.tokens ?? 0) : 0), 0)

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={1}>
          <Text bold color={colors.primary}>Chat</Text>
          <Text dimColor>·</Text>
          <Text dimColor>{THREAD.length} messages</Text>
        </Box>
        <Text dimColor>{totalTokens} tokens</Text>
      </Box>

      {msgGroups.map((group, gi) => {
        const msg = THREAD[group.msgIdx]!
        const isUser = msg.role === 'user'
        const accent = isUser ? colors.warning : colors.primary
        const isLastGroup = gi === msgGroups.length - 1

        if (isUser) {
          const selected = group.items[0]!.fi === cursor
          return (
            <Box key={group.msgIdx} flexDirection="column">
              <Box>
                <Box flexDirection="column" marginRight={1}>
                  <Text color={selected ? accent : '#333333'}>┃</Text>
                </Box>
                <Box flexDirection="column">
                  <Box gap={1}>
                    <Text bold color={accent}>you</Text>
                    <Text dimColor>{msg.timestamp}</Text>
                  </Box>
                  <Text>{msg.text}</Text>
                </Box>
              </Box>
              {!isLastGroup && <Box><Text dimColor> </Text></Box>}
            </Box>
          )
        }

        // Assistant message
        const aMsg = msg as Extract<Message, { role: 'assistant' }>
        return (
          <Box key={group.msgIdx} flexDirection="column">
            {/* Message header */}
            <Box>
              <Box marginRight={1}>
                <Text color={accent}>┃</Text>
              </Box>
              <Box gap={1}>
                <Text bold color={accent}>assistant</Text>
                {aMsg.model && <Text dimColor>{aMsg.model}</Text>}
                <Text dimColor>{aMsg.timestamp}</Text>
                {aMsg.tokens && <Text dimColor>· {aMsg.tokens}t</Text>}
              </Box>
            </Box>

            {/* Parts */}
            {group.items.map(({ fi, partIdx }) => {
              const part = aMsg.parts[partIdx!]!
              const selected = fi === cursor
              const coll = isCollapsed(group.msgIdx, partIdx!)

              // Determine accent color for this part's bar
              let partAccent = accent
              if (part.type === 'tool-call') partAccent = toolColor(part.tool, colors)
              if (part.type === 'reasoning') partAccent = colors.secondary

              const barColor = selected ? partAccent : '#333333'

              return (
                <Box key={fi} flexDirection="column">
                  <Box>
                    <Box marginRight={1}>
                      <Text color={barColor}>┃</Text>
                    </Box>

                    <Box flexDirection="column" flexGrow={1}>
                      {part.type === 'reasoning' && (
                        <Box flexDirection="column">
                          <Box gap={1}>
                            <Text color={selected ? colors.secondary : '#555555'}>
                              {part.status === 'streaming' ? spin : (coll ? '▶' : '▼')}
                            </Text>
                            <Text dimColor>
                              {part.status === 'streaming' ? 'Reasoning...' : `Thought for ${part.duration}`}
                            </Text>
                          </Box>
                          {!coll && (
                            <Box marginLeft={3} flexDirection="column">
                              {part.text.split('\n').map((line, li) => (
                                <Text key={li} dimColor>{line}</Text>
                              ))}
                            </Box>
                          )}
                        </Box>
                      )}

                      {part.type === 'tool-call' && (
                        <Box flexDirection="column">
                          <Box gap={1}>
                            <Text color={part.status === 'done' ? colors.success : (part.status === 'error' ? colors.error : colors.primary)}>
                              {part.status === 'running' ? spin : (part.status === 'error' ? '✗' : '✓')}
                            </Text>
                            <Text color={toolColor(part.tool, colors)} bold>{part.tool}</Text>
                            <Text dimColor>{part.input}</Text>
                            {coll && <Text dimColor>{part.status === 'running' ? '' : (part.status === 'error' ? '· error' : '')}</Text>}
                          </Box>
                          {!coll && part.output && (
                            <Box marginLeft={3}>
                              <Text dimColor>{part.output}</Text>
                            </Box>
                          )}
                        </Box>
                      )}

                      {part.type === 'text' && (
                        <Box flexDirection="column">
                          {part.text.split('\n').map((line, li) => (
                            <Box key={li}>{formatLine(line, colors)}</Box>
                          ))}
                        </Box>
                      )}

                      {part.type === 'code' && (
                        <Box flexDirection="column">
                          <Box gap={1}>
                            {part.file && <Text color={colors.info}>{part.file}</Text>}
                            <Text dimColor>{part.lang}</Text>
                          </Box>
                          <Text color={colors.secondary}>{'━'.repeat(40)}</Text>
                          {part.code.split('\n').map((line, li) => (
                            <Box key={li} gap={1}>
                              <Text dimColor>{String(li + 1).padStart(3)}</Text>
                              <Text>{colorCode(line, colors)}</Text>
                            </Box>
                          ))}
                          <Text color={colors.secondary}>{'━'.repeat(40)}</Text>
                        </Box>
                      )}

                      {part.type === 'source' && (
                        <Box gap={1}>
                          <Text dimColor>[{part.index}]</Text>
                          <Text color={colors.info}>{part.title}</Text>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              )
            })}

            {!isLastGroup && <Box><Text dimColor> </Text></Box>}
          </Box>
        )
      })}

      <Help keys={[
        { key: 'j/k', label: 'navigate' },
        { key: 'enter', label: 'collapse' },
      ]} />
    </Box>
  )
}

/* ── Formatting helpers ── */

function formatLine(line: string, colors: ReturnType<typeof useTheme>) {
  if (line.includes('`')) {
    const parts = line.split('`')
    return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.info} bold>{p}</Text> : <Text key={i}>{p}</Text>)}</Text>
  }
  return <Text>{line}</Text>
}

const KW = new Set(['import', 'export', 'from', 'const', 'let', 'return', 'new', 'function', 'if', 'else', 'switch', 'case'])

function colorCode(line: string, colors: ReturnType<typeof useTheme>) {
  const tokens = line.split(/(\s+|[{}().,;:=]|'[^']*'|"[^"]*"|`[^`]*`)/)
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
