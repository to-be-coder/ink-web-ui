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
    text: 'Can you explain how React Server Components work?',
    timestamp: '3:42 PM',
    tokens: 11,
  },
  {
    role: 'assistant',
    text: "React Server Components (RSC) run exclusively on the server.\nThey can directly access databases, file systems, and other\nserver-side resources without sending that code to the client.\n\nKey differences from Client Components:\n\n  1. No useState, useEffect, or browser APIs\n  2. Can use async/await directly in the component\n  3. Never included in the client JS bundle\n  4. Can import Client Components, but not vice versa\n\nThink of them as the server's rendering layer — they produce\nUI that gets streamed to the browser as HTML + a lightweight\npayload for reconciliation.",
    timestamp: '3:42 PM',
    tokens: 156,
    model: 'opus-4',
  },
  {
    role: 'user',
    text: 'How do I pass data between server and client components?',
    timestamp: '3:43 PM',
    tokens: 13,
  },
  {
    role: 'assistant',
    text: "You pass data via props — but they must be serializable.\n\nServer Component can fetch data and pass it down:\n\n  async function UserPage({ id }) {\n    const user = await db.user.findUnique({ where: { id } })\n    return <ClientProfile user={user} />\n  }\n\nThe `user` object gets serialized across the server-client\nboundary automatically. Functions, classes, and Dates need\nspecial handling — use `superjson` or serialize manually.",
    timestamp: '3:43 PM',
    tokens: 112,
    model: 'opus-4',
  },
]

/* ── Component ── */

export function AIMessageBubbleV2() {
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
        timers.push(setTimeout(() => { if (mountedRef.current) setVisible(prev => [...prev, msg]) }, delay))
        delay += 800
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
        delay += 500
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [ready, runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  if (!ready) return <Box />

  const currentStream = streaming ? MESSAGES[streamIdx] : null

  return (
    <Box flexDirection="column" paddingX={1}>
      {visible.map((msg, i) => (
        <MessageRow key={i} msg={msg} colors={colors} />
      ))}

      {currentStream && (
        <Box flexDirection="column" marginBottom={1}>
          <Box gap={1} marginBottom={0}>
            <Text color={colors.primary} bold>assistant</Text>
            <Text color={colors.primary}>{SPIN[frame % SPIN.length]}</Text>
          </Box>
          <Box marginLeft={2} flexDirection="column">
            <Box flexDirection="column">
              {streamText.split('\n').map((line, li) => (
                <Text key={li}>{line}</Text>
              ))}
            </Box>
            <Text dimColor>{'▎'}</Text>
          </Box>
        </Box>
      )}

      <Help keys={[{ key: 'r', label: 'replay' }]} />
    </Box>
  )
}

/* ── Message Row ── */

function MessageRow({ msg, colors }: { msg: Message; colors: ReturnType<typeof useTheme> }) {
  const isUser = msg.role === 'user'
  const accent = isUser ? colors.warning : colors.primary

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Header */}
      <Box gap={1}>
        <Text color={accent}>{'│'}</Text>
        <Text bold color={accent}>
          {isUser ? 'you' : 'assistant'}
        </Text>
        <Text dimColor>{msg.timestamp}</Text>
        {msg.model && <Text dimColor color={colors.secondary}>{msg.model}</Text>}
        {msg.tokens && <Text dimColor>{msg.tokens}t</Text>}
      </Box>

      {/* Body */}
      <Box flexDirection="column">
        {msg.text.split('\n').map((line, li) => (
          <Box key={li}>
            <Text color={accent}>{'│'}</Text>
            <Text> </Text>
            <Text dimColor={!isUser && line.trim() === ''}>{formatLine(line, colors)}</Text>
          </Box>
        ))}
        <Text color={accent}>{'╵'}</Text>
      </Box>
    </Box>
  )
}

/* ── Format inline code ── */

function formatLine(line: string, colors: ReturnType<typeof useTheme>) {
  if (line.includes('`') && line.split('`').length >= 3) {
    const parts = line.split('`')
    return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.info} bold>`{p}`</Text> : <Text key={i}>{p}</Text>)}</Text>
  }
  if (/^\s*\d+\.\s/.test(line)) {
    const match = line.match(/^(\s*)(\d+\.)(.*)/)
    if (match) {
      return <Text>{match[1]}<Text color={colors.primary}>{match[2]}</Text>{match[3]}</Text>
    }
  }
  if (line.trim().startsWith('async ') || line.trim().startsWith('const ') || line.trim().startsWith('return ') || line.trim().startsWith('function ')) {
    return <Text color={colors.secondary}>{line}</Text>
  }
  return <Text>{line}</Text>
}
