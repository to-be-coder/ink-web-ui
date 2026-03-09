import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from '../theme'
import { Help, SPIN } from './utils'

/* ── Types ── */

interface Message {
  role: 'user' | 'assistant'
  text: string
  tokens?: number
  timestamp: string
  model?: string
}

/* ── Data ── */

const MESSAGES: Message[] = [
  {
    role: 'user',
    text: 'How do I handle errors in async/await?',
    timestamp: '2:30 PM',
    tokens: 10,
  },
  {
    role: 'assistant',
    text: "Wrap the await call in try/catch:\n\n  try {\n    const data = await fetchUser(id)\n  } catch (err) {\n    console.error('Failed:', err.message)\n  }\n\nFor multiple calls, you can catch individually or\nlet errors propagate to a single handler.",
    timestamp: '2:30 PM',
    tokens: 64,
    model: 'opus-4',
  },
  {
    role: 'user',
    text: 'What about Promise.allSettled?',
    timestamp: '2:31 PM',
    tokens: 7,
  },
  {
    role: 'assistant',
    text: "`Promise.allSettled` waits for all promises to finish,\nregardless of rejection:\n\n  const results = await Promise.allSettled([\n    fetchUser(1),\n    fetchUser(2),\n    fetchUser(3),\n  ])\n\nEach result has `status: 'fulfilled'` or `'rejected'`.\nUnlike `Promise.all`, one failure won't cancel the rest.",
    timestamp: '2:31 PM',
    tokens: 82,
    model: 'opus-4',
  },
  {
    role: 'user',
    text: 'When should I use each?',
    timestamp: '2:32 PM',
    tokens: 6,
  },
  {
    role: 'assistant',
    text: "Use `Promise.all` when every result is required — if one\nfails, you want to bail out.\n\nUse `Promise.allSettled` when you want partial results —\ne.g. fetching data for a dashboard where some widgets can\nfail gracefully.\n\nUse `Promise.race` when you only need the fastest response,\nlike a timeout pattern.",
    timestamp: '2:32 PM',
    tokens: 71,
    model: 'opus-4',
  },
]

/* ── Bubble background colors (dark, muted) ── */

const USER_BG = '#1a1a2e'
const ASSISTANT_BG = '#16213e'

/* ── Pad a line to fill the bubble width ── */

function padLine(text: string, width: number): string {
  const len = text.length
  if (len >= width) return text
  return text + ' '.repeat(width - len)
}

/* ── Component ── */

export function AIMessageBubbleV5() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [frame, setFrame] = useState(0)
  const [visible, setVisible] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [streamIdx, setStreamIdx] = useState(0)
  const [runId, setRunId] = useState(0)

  const bubbleWidth = 56

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) { stdout.write('\x1b[2J\x1b[H'); setReady(true) }
    }, 300)
    return () => { mountedRef.current = false; clearTimeout(id) }
  }, [])

  useEffect(() => {
    if (!ready) return
    const id = setInterval(() => { if (mountedRef.current) setFrame(f => f + 1) }, 80)
    return () => clearInterval(id)
  }, [ready])

  useEffect(() => {
    if (!ready) return
    setVisible([])
    setStreaming(false)
    setStreamText('')

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 400

    MESSAGES.forEach((msg, i) => {
      if (msg.role === 'user') {
        timers.push(setTimeout(() => {
          if (mountedRef.current) setVisible(prev => [...prev, msg])
        }, delay))
        delay += 600
      } else {
        timers.push(setTimeout(() => {
          if (mountedRef.current) { setStreaming(true); setStreamText(''); setStreamIdx(i) }
        }, delay))
        delay += 200
        const len = msg.text.length
        for (let c = 0; c <= len; c += 4) {
          timers.push(setTimeout(() => {
            if (mountedRef.current) setStreamText(msg.text.slice(0, c))
          }, delay + (c / 4) * 18))
        }
        delay += (len / 4) * 18 + 200
        timers.push(setTimeout(() => {
          if (mountedRef.current) { setStreaming(false); setVisible(prev => [...prev, msg]) }
        }, delay))
        delay += 400
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [ready, runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  if (!ready) return <Box />

  const spin = SPIN[frame % SPIN.length]
  const currentStream = streaming ? MESSAGES[streamIdx] : null
  const w = bubbleWidth

  return (
    <Box flexDirection="column" paddingX={1}>
      {visible.map((msg, i) => (
        <Bubble key={i} msg={msg} colors={colors} width={w} />
      ))}

      {/* Streaming bubble */}
      {currentStream && (
        <Box flexDirection="column" marginBottom={1}>
          {/* Header line */}
          <Box>
            <Text backgroundColor={ASSISTANT_BG} color={colors.primary} bold>
              {padLine(` assistant ${spin}`, w)}
            </Text>
          </Box>
          {/* Body lines */}
          {streamText.split('\n').map((line, li) => (
            <Box key={li}>
              <Text backgroundColor={ASSISTANT_BG}>
                {padLine(` ${line}`, w)}
              </Text>
            </Box>
          ))}
          {/* Bottom pad */}
          <Box>
            <Text backgroundColor={ASSISTANT_BG}>{' '.repeat(w)}</Text>
          </Box>
        </Box>
      )}

      <Help keys={[{ key: 'r', label: 'replay' }]} />
    </Box>
  )
}

/* ── Bubble ── */

function Bubble({ msg, colors, width }: { msg: Message; colors: ReturnType<typeof useTheme>; width: number }) {
  const isUser = msg.role === 'user'
  const bg = isUser ? USER_BG : ASSISTANT_BG
  const accent = isUser ? colors.warning : colors.primary
  const w = width

  // Build header text
  const role = isUser ? 'you' : 'assistant'
  const meta = [msg.timestamp, msg.model, msg.tokens ? `${msg.tokens}t` : ''].filter(Boolean).join('  ')

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Header */}
      <Box>
        <Text backgroundColor={bg} color={accent} bold>
          {' '}{role}
        </Text>
        <Text backgroundColor={bg} dimColor>
          {padLine(`  ${meta}`, w - role.length - 1)}
        </Text>
      </Box>

      {/* Body */}
      {msg.text.split('\n').map((line, li) => (
        <Box key={li}>
          <Text backgroundColor={bg}>
            {' '}
          </Text>
          <BubbleLine line={line} bg={bg} colors={colors} width={w - 1} />
        </Box>
      ))}

      {/* Bottom padding */}
      <Box>
        <Text backgroundColor={bg}>{' '.repeat(w)}</Text>
      </Box>
    </Box>
  )
}

/* ── Bubble line with formatting ── */

function BubbleLine({ line, bg, colors, width }: { line: string; bg: string; colors: ReturnType<typeof useTheme>; width: number }) {
  // Inline code
  if (line.includes('`') && line.split('`').length >= 3) {
    const parts = line.split('`')
    const raw = parts.join('')
    const pad = Math.max(0, width - line.length)
    return (
      <Text backgroundColor={bg}>
        {parts.map((p, i) =>
          i % 2 === 1
            ? <Text key={i} color={colors.info} backgroundColor="#0d1b2a" bold>{`\``}{p}{`\``}</Text>
            : <Text key={i} backgroundColor={bg}>{p}</Text>
        )}
        <Text backgroundColor={bg}>{' '.repeat(pad)}</Text>
      </Text>
    )
  }

  // Indented code-style lines
  if (/^\s{2}\S/.test(line)) {
    return (
      <Text backgroundColor={bg} color={colors.secondary}>
        {padLine(line, width)}
      </Text>
    )
  }

  // Regular line
  return (
    <Text backgroundColor={bg}>
      {padLine(line, width)}
    </Text>
  )
}
