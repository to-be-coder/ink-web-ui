import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

type Status = 'hidden' | 'active' | 'done'

type Part =
  | { type: 'thinking'; text: string; status: Status }
  | { type: 'tool'; name: string; args: string; result: string; status: Status }
  | { type: 'text'; text: string; status: Status; charIdx: number }

type Message =
  | { role: 'user'; text: string }
  | { role: 'assistant'; parts: Part[]; tokens: number }

/* ── Spinner ── */

const SPIN = ['·', ':', '∴', '∷', '∴', ':']

/* ── Data ── */

function init(): Message[] {
  return [
    { role: 'user', text: 'Refactor the user service to use dependency injection' },
    {
      role: 'assistant', tokens: 0,
      parts: [
        { type: 'thinking', status: 'hidden', text: 'I need to decouple UserService from its dependencies — the database client and the email sender. I\'ll create interfaces for both and inject them via the constructor.' },
        { type: 'tool', name: 'Read', args: 'src/services/user.ts', result: '84 lines — direct Prisma and Resend imports', status: 'hidden' },
        { type: 'tool', name: 'Read', args: 'src/services/user.test.ts', result: '46 lines — no mocks, hits real DB', status: 'hidden' },
        { type: 'text', status: 'hidden', charIdx: 0, text: 'The current UserService has hard-coded dependencies on Prisma and Resend. I\'ll extract interfaces and inject them through the constructor.' },
        { type: 'tool', name: 'Edit', args: 'src/services/user.ts', result: 'refactored to accept deps via constructor', status: 'hidden' },
        { type: 'tool', name: 'Write', args: 'src/services/interfaces.ts', result: 'created IDatabase, IEmailSender interfaces', status: 'hidden' },
        { type: 'tool', name: 'Edit', args: 'src/services/user.test.ts', result: 'added mock implementations for testing', status: 'hidden' },
        { type: 'text', status: 'hidden', charIdx: 0, text: 'Done. UserService now accepts IDatabase and IEmailSender via constructor. Tests use lightweight mocks instead of real services. Run npm test to verify.' },
      ],
    },
    { role: 'user', text: 'Does the test still pass?' },
    {
      role: 'assistant', tokens: 0,
      parts: [
        { type: 'tool', name: 'Bash', args: 'npm test -- --reporter=min', result: '12 passed, 0 failed (0.8s)', status: 'hidden' },
        { type: 'text', status: 'hidden', charIdx: 0, text: 'All 12 tests pass. The mock-based tests run in under a second now — previously they took ~4s hitting the real database.' },
      ],
    },
  ]
}

/* ── Component ── */

export function ChatFlowClean() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [frame, setFrame] = useState(0)
  const [msgs, setMsgs] = useState<Message[]>(init)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
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
    const id = setInterval(() => { if (mountedRef.current) setFrame(f => f + 1) }, 120)
    return () => clearInterval(id)
  }, [ready])

  // Animation
  useEffect(() => {
    if (!ready) return
    setMsgs(init())
    setCollapsed(new Set())

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 300

    const data = init()
    const steps: { mi: number; pi: number; part: Part }[] = []
    data.forEach((m, mi) => {
      if (m.role === 'assistant') m.parts.forEach((p, pi) => steps.push({ mi, pi, part: p }))
    })

    for (const { mi, pi, part } of steps) {
      // Activate
      timers.push(setTimeout(() => {
        if (!mountedRef.current) return
        setMsgs(prev => {
          const next = JSON.parse(JSON.stringify(prev)) as Message[]
          ;(next[mi] as { role: 'assistant'; parts: Part[] }).parts[pi]!.status = 'active'
          return next
        })
      }, delay))

      let dur = part.type === 'thinking' ? 1200 : part.type === 'tool' ? 500 : 600

      // Stream text
      if (part.type === 'text') {
        const len = part.text.length
        const step = 4
        const ticks = Math.ceil(len / step)
        for (let t = 0; t <= ticks; t++) {
          timers.push(setTimeout(() => {
            if (!mountedRef.current) return
            setMsgs(prev => {
              const next = JSON.parse(JSON.stringify(prev)) as Message[]
              const p = (next[mi] as { role: 'assistant'; parts: Part[] }).parts[pi] as { type: 'text'; charIdx: number }
              p.charIdx = Math.min(t * step, len)
              return next
            })
          }, delay + t * 25))
        }
        dur = Math.max(dur, ticks * 25 + 50)
      }

      // Done
      timers.push(setTimeout(() => {
        if (!mountedRef.current) return
        setMsgs(prev => {
          const next = JSON.parse(JSON.stringify(prev)) as Message[]
          const p = (next[mi] as { role: 'assistant'; parts: Part[]; tokens: number }).parts[pi]!
          p.status = 'done'
          if (p.type === 'text') (p as any).charIdx = p.text.length
          const a = next[mi] as { role: 'assistant'; tokens: number; parts: Part[] }
          a.tokens = a.parts.filter(pp => pp.status === 'done').length * 38 + Math.floor(Math.random() * 20)
          return next
        })
        if (part.type === 'thinking' || part.type === 'tool') {
          setTimeout(() => {
            if (mountedRef.current) setCollapsed(prev => new Set([...prev, `${mi}:${pi}`]))
          }, 250)
        }
      }, delay + dur))

      delay += dur + 120
    }

    return () => timers.forEach(clearTimeout)
  }, [ready, runId])

  useInput((ch) => {
    if (ch === 'e') {
      if (collapsed.size > 0) { setCollapsed(new Set()) }
      else {
        const keys = new Set<string>()
        msgs.forEach((m, mi) => {
          if (m.role === 'assistant') m.parts.forEach((p, pi) => {
            if ((p.type === 'thinking' || p.type === 'tool') && p.status === 'done') keys.add(`${mi}:${pi}`)
          })
        })
        setCollapsed(keys)
      }
    }
    if (ch === 'r') setRunId(n => n + 1)
  })

  if (!ready) return <Box />

  const spin = SPIN[frame % SPIN.length]
  const coll = (mi: number, pi: number) => collapsed.has(`${mi}:${pi}`)

  const toolClr = (name: string) => {
    if (name === 'Read') return colors.info
    if (name === 'Edit') return colors.success
    if (name === 'Write') return colors.primary
    if (name === 'Bash') return colors.warning
    return colors.info
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {msgs.map((msg, mi) => {
        if (msg.role === 'user') {
          return (
            <Box key={mi} marginBottom={1}>
              <Text dimColor>{'>'} </Text>
              <Text bold>{msg.text}</Text>
            </Box>
          )
        }

        const a = msg
        const visible = a.parts.filter(p => p.status !== 'hidden')
        if (visible.length === 0) return null
        const active = a.parts.some(p => p.status === 'active')

        return (
          <Box key={mi} flexDirection="column" marginBottom={1}>
            {a.parts.map((part, pi) => {
              if (part.status === 'hidden') return null

              if (part.type === 'thinking') {
                const isC = coll(mi, pi)
                return (
                  <Box key={pi} flexDirection="column">
                    <Box gap={1}>
                      <Text dimColor>{part.status === 'active' ? spin : (isC ? '▸' : '▾')}</Text>
                      <Text dimColor italic>{part.status === 'active' ? 'thinking…' : 'reasoning'}</Text>
                    </Box>
                    {!isC && (
                      <Box marginLeft={3}>
                        <Text dimColor>{part.status === 'active' ? part.text.slice(0, Math.min((frame * 3), part.text.length)) : part.text}</Text>
                      </Box>
                    )}
                  </Box>
                )
              }

              if (part.type === 'tool') {
                const tc = toolClr(part.name)
                const isC = coll(mi, pi)
                return (
                  <Box key={pi} flexDirection="column">
                    <Box gap={1}>
                      <Text color={part.status === 'active' ? tc : colors.success}>
                        {part.status === 'active' ? spin : '✓'}
                      </Text>
                      <Text color={tc}>{part.name}</Text>
                      <Text dimColor>{part.args}</Text>
                    </Box>
                    {!isC && part.status === 'done' && (
                      <Box marginLeft={3}>
                        <Text dimColor>→ {part.result}</Text>
                      </Box>
                    )}
                  </Box>
                )
              }

              if (part.type === 'text') {
                const txt = part.status === 'active' ? part.text.slice(0, part.charIdx) : part.text
                const cursor = part.status === 'active' && part.charIdx < part.text.length
                return (
                  <Box key={pi} marginTop={1} marginBottom={1}>
                    <Text>{txt}</Text>
                    {cursor && <Text dimColor>▎</Text>}
                  </Box>
                )
              }

              return null
            })}

            {/* Token count after all parts done */}
            {!active && a.tokens > 0 && (
              <Box>
                <Text dimColor>{a.tokens} tokens</Text>
              </Box>
            )}
          </Box>
        )
      })}

      {/* Footer */}
      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> e </Text><Text dimColor> {collapsed.size > 0 ? 'expand' : 'collapse'}</Text></Box>
        <Box><Text inverse bold> r </Text><Text dimColor> replay</Text></Box>
      </Box>
    </Box>
  )
}
