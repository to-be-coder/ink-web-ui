import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Badge, BRAILLE_FRAMES } from './utils'

/* ── Types ── */

interface Message {
  role: 'user' | 'assistant'
  text: string
  tokens?: number
}

/* ── Demo conversation ── */

const CONVERSATION: Message[] = [
  { role: 'user', text: 'Add authentication to the Express app', tokens: 12 },
  {
    role: 'assistant',
    text: `I'll add JWT authentication to your Express app. Let me:\n\n1. Create \`src/auth.ts\` with token helpers\n2. Add auth middleware to protected routes\n3. Create a login endpoint\n\nLet me start by reading the current codebase.`,
    tokens: 48,
  },
  { role: 'user', text: 'Sounds good, go ahead', tokens: 8 },
  {
    role: 'assistant',
    text: `I've made the following changes:\n\n**Created** \`src/auth.ts\`\n- \`verifyToken()\` — validates JWT from header\n- \`requireAuth()\` — Express middleware guard\n- \`generateToken()\` — signs payload with secret\n\n**Updated** \`src/routes.ts\`\n- Added \`requireAuth\` to GET /users, POST /users\n- Added POST /auth/login route\n\n**Updated** \`src/app.ts\`\n- Registered auth routes\n\nAll 18 tests passing.`,
    tokens: 96,
  },
]

/* ── Main ── */

export function ModernStreamingChat() {
  const colors = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [streamIdx, setStreamIdx] = useState(0)
  const [streamPos, setStreamPos] = useState(0)
  const [streaming, setStreaming] = useState(false)
  const [frame, setFrame] = useState(0)
  const [scroll, setScroll] = useState(0)
  const [runId, setRunId] = useState(0)

  // Spinner animation
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  // Auto-play conversation
  useEffect(() => {
    setMessages([])
    setStreamIdx(0)
    setStreamPos(0)
    setStreaming(false)
    setScroll(0)

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 500

    CONVERSATION.forEach((msg, i) => {
      if (msg.role === 'user') {
        timers.push(setTimeout(() => {
          setMessages(prev => [...prev, msg])
          setStreamIdx(i + 1)
        }, delay))
        delay += 1500
      } else {
        // Start streaming
        timers.push(setTimeout(() => {
          setStreaming(true)
          setStreamPos(0)
          setStreamIdx(i)
        }, delay))
        delay += 300

        // Stream characters
        const chars = msg.text.length
        const charsPerTick = 3
        for (let c = 0; c <= chars; c += charsPerTick) {
          timers.push(setTimeout(() => {
            setStreamPos(c)
          }, delay + (c / charsPerTick) * 30))
        }
        delay += (chars / charsPerTick) * 30 + 200

        // Complete message
        timers.push(setTimeout(() => {
          setStreaming(false)
          setMessages(prev => [...prev, msg])
          setStreamIdx(i + 1)
        }, delay))
        delay += 1000
      }
    })

    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch, key) => {
    if (key.upArrow) setScroll(s => Math.max(0, s - 1))
    if (key.downArrow) setScroll(s => s + 1)
    if (ch === 'r') setRunId(n => n + 1)
  })

  const totalTokens = messages.reduce((sum, m) => sum + (m.tokens ?? 0), 0)
  const currentStreamMsg = streaming ? CONVERSATION[streamIdx] : null

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>Streaming Chat</Text>
          <Box gap={1}>
            <Badge label={`${totalTokens} tokens`} color={colors.info} />
          </Box>
        </Box>

        <Box flexDirection="column" gap={0}>
          {messages.map((msg, i) => (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Box gap={1}>
                <Text bold color={msg.role === 'user' ? colors.warning : colors.primary}>
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </Text>
                {msg.tokens && <Text dimColor>{msg.tokens}t</Text>}
              </Box>
              {msg.text.split('\n').map((line, li) => (
                <Box key={li}>
                  <Text color={msg.role === 'user' ? undefined : undefined} dimColor={msg.role === 'user'}>
                    {renderLine(line, colors)}
                  </Text>
                </Box>
              ))}
            </Box>
          ))}

          {/* Currently streaming message */}
          {currentStreamMsg && (
            <Box flexDirection="column" marginBottom={1}>
              <Box gap={1}>
                <Text bold color={colors.primary}>Assistant</Text>
                <Text color={colors.primary}>{BRAILLE_FRAMES[frame % BRAILLE_FRAMES.length]}</Text>
              </Box>
              {currentStreamMsg.text.slice(0, streamPos).split('\n').map((line, li) => (
                <Box key={li}>
                  <Text>{renderLine(line, colors)}</Text>
                </Box>
              ))}
            </Box>
          )}

          {/* Typing indicator when about to stream */}
          {!streaming && messages.length < CONVERSATION.length && messages.length > 0 && !currentStreamMsg && (
            <Box gap={1}>
              <Text color={colors.primary}>{BRAILLE_FRAMES[frame % BRAILLE_FRAMES.length]}</Text>
              <Text dimColor>thinking...</Text>
            </Box>
          )}
        </Box>

        <HelpFooter keys={[
          { key: '\u2191\u2193', label: 'scroll' },
          { key: 'r', label: 'restart' },
        ]} />
      </Card>
    </Box>
  )
}

/* ── Simple markdown-lite renderer ── */

function renderLine(line: string, colors: ReturnType<typeof useTheme>) {
  // Bold markers
  if (line.startsWith('**') && line.includes('**', 2)) {
    const end = line.indexOf('**', 2)
    const bold = line.slice(2, end)
    const rest = line.slice(end + 2)
    return <Text><Text bold color={colors.success}>{bold}</Text>{rest}</Text>
  }
  // List items
  if (line.startsWith('- ')) {
    return <Text><Text color={colors.primary}>{'\u2022'}</Text> {line.slice(2)}</Text>
  }
  // Numbered list
  if (/^\d+\. /.test(line)) {
    const num = line.match(/^(\d+)\. /)![1]
    return <Text><Text color={colors.primary}>{num}.</Text> {line.slice(num!.length + 2)}</Text>
  }
  // Inline code
  if (line.includes('`')) {
    const parts = line.split('`')
    return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.info}>{p}</Text> : <Text key={i}>{p}</Text>)}</Text>
  }
  return <Text>{line}</Text>
}
