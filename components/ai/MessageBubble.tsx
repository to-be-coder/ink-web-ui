import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, SPIN } from './utils'

interface Message {
  role: 'user' | 'assistant'
  text: string
  tokens?: number
  timestamp?: string
}

const MESSAGES: Message[] = [
  { role: 'user', text: 'Add authentication to the Express app', tokens: 12, timestamp: '2:14 PM' },
  { role: 'assistant', text: "I'll add JWT authentication to your Express app. Here's my plan:\n\n1. Create `src/auth.ts` with token helpers\n2. Add middleware to protected routes\n3. Create a login endpoint\n4. Run tests to verify\n\nLet me start by reading the codebase.", tokens: 52, timestamp: '2:14 PM' },
  { role: 'user', text: 'Go ahead', tokens: 4, timestamp: '2:15 PM' },
  { role: 'assistant', text: "Done. I've made the following changes:\n\n`src/auth.ts` — Created with verifyToken, requireAuth, generateToken\n`src/routes.ts` — Added auth middleware to /users routes\n`src/app.ts` — Registered auth routes\n`src/types.ts` — Added User and AuthPayload interfaces\n\nAll 18 tests passing.", tokens: 68, timestamp: '2:16 PM' },
]

export function AIMessageBubble() {
  const colors = useTheme()
  const [visible, setVisible] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [streamIdx, setStreamIdx] = useState(0)
  const [frame, setFrame] = useState(0)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setVisible([])
    setStreaming(false)
    setStreamText('')

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 400

    MESSAGES.forEach((msg, i) => {
      if (msg.role === 'user') {
        timers.push(setTimeout(() => setVisible(prev => [...prev, msg]), delay))
        delay += 1000
      } else {
        timers.push(setTimeout(() => { setStreaming(true); setStreamText(''); setStreamIdx(i) }, delay))
        delay += 200
        const len = msg.text.length
        for (let c = 0; c <= len; c += 3) {
          timers.push(setTimeout(() => setStreamText(msg.text.slice(0, c)), delay + (c / 3) * 20))
        }
        delay += (len / 3) * 20 + 200
        timers.push(setTimeout(() => {
          setStreaming(false)
          setVisible(prev => [...prev, msg])
        }, delay))
        delay += 600
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  const currentStream = streaming ? MESSAGES[streamIdx] : null

  return (
    <Box flexDirection="column" padding={1}>
      {visible.map((msg, i) => (
        <Box key={i} flexDirection="column" marginBottom={1}>
          <Box gap={1}>
            <Text bold color={msg.role === 'user' ? colors.warning : colors.primary}>
              {msg.role === 'user' ? 'You' : 'Claude'}
            </Text>
            {msg.timestamp && <Text dimColor>{msg.timestamp}</Text>}
            {msg.tokens && <Text dimColor>{msg.tokens}t</Text>}
          </Box>
          {msg.text.split('\n').map((line, li) => (
            <Text key={li}>{renderLine(line, colors)}</Text>
          ))}
        </Box>
      ))}

      {currentStream && (
        <Box flexDirection="column" marginBottom={1}>
          <Box gap={1}>
            <Text bold color={colors.primary}>Claude</Text>
            <Text color={colors.primary}>{SPIN[frame % SPIN.length]}</Text>
          </Box>
          {streamText.split('\n').map((line, li) => (
            <Text key={li}>{renderLine(line, colors)}</Text>
          ))}
        </Box>
      )}

      <Help keys={[{ key: 'r', label: 'restart' }]} />
    </Box>
  )
}

function renderLine(line: string, colors: ReturnType<typeof useTheme>) {
  if (line.includes('`') && line.split('`').length >= 3) {
    const parts = line.split('`')
    return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.info}>`{p}`</Text> : <Text key={i}>{p}</Text>)}</Text>
  }
  if (/^\d+\. /.test(line)) {
    const num = line.match(/^(\d+)\. /)![1]
    return <Text><Text color={colors.primary}>{num}.</Text>{line.slice(num!.length + 1)}</Text>
  }
  return <Text>{line}</Text>
}
