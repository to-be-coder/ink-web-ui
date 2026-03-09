import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, SPIN } from './utils'

interface Message { role: 'user' | 'assistant'; text: string }

const CONVERSATION: Message[] = [
  { role: 'user', text: 'Add authentication to the Express app' },
  { role: 'assistant', text: "I'll add JWT authentication. Let me:\n\n1. Create src/auth.ts with token helpers\n2. Add auth middleware to protected routes\n3. Create a login endpoint\n\nLet me start by reading the codebase." },
  { role: 'user', text: 'Sounds good, go ahead' },
  { role: 'assistant', text: "Done. Created src/auth.ts with verifyToken, requireAuth, and generateToken. Updated routes.ts with auth middleware on /users. Added POST /auth/login. All 18 tests passing." },
]

export function CleanStreamingChat() {
  const colors = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
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
    setMessages([])
    setStreaming(false)
    setStreamText('')
    setStreamIdx(0)

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 500

    CONVERSATION.forEach((msg, i) => {
      if (msg.role === 'user') {
        timers.push(setTimeout(() => setMessages(prev => [...prev, msg]), delay))
        delay += 1200
      } else {
        timers.push(setTimeout(() => { setStreaming(true); setStreamText(''); setStreamIdx(i) }, delay))
        delay += 200
        const len = msg.text.length
        for (let c = 0; c <= len; c += 3) {
          timers.push(setTimeout(() => setStreamText(msg.text.slice(0, c)), delay + (c / 3) * 25))
        }
        delay += (len / 3) * 25 + 300
        timers.push(setTimeout(() => {
          setStreaming(false)
          setMessages(prev => [...prev, msg])
        }, delay))
        delay += 800
      }
    })

    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  return (
    <Box flexDirection="column" padding={1}>
      {messages.map((msg, i) => (
        <Box key={i} flexDirection="column" marginBottom={1}>
          <Text bold color={msg.role === 'user' ? undefined : colors.primary}>
            {msg.role === 'user' ? 'You' : 'Assistant'}
          </Text>
          {msg.text.split('\n').map((line, li) => (
            <Text key={li} dimColor={msg.role === 'user'}>{line}</Text>
          ))}
        </Box>
      ))}

      {streaming && (
        <Box flexDirection="column" marginBottom={1}>
          <Box gap={1}>
            <Text bold color={colors.primary}>Assistant</Text>
            <Text color={colors.primary}>{SPIN[frame % SPIN.length]}</Text>
          </Box>
          {streamText.split('\n').map((line, li) => (
            <Text key={li}>{line}</Text>
          ))}
        </Box>
      )}

      <Help keys={[{ key: 'r', label: 'restart' }]} />
    </Box>
  )
}
