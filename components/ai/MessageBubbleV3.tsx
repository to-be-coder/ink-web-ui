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
  thinking?: string
}

/* ── Data ── */

const MESSAGES: Message[] = [
  {
    role: 'user',
    text: 'Write a retry utility with exponential backoff',
    timestamp: '11:08',
    tokens: 9,
  },
  {
    role: 'assistant',
    text: "Here's a clean retry utility with exponential backoff and jitter:",
    timestamp: '11:08',
    tokens: 94,
    model: 'sonnet',
    thinking: 'Exponential backoff with jitter prevents thundering herd. I\'ll use a generic async function wrapper.',
  },
  {
    role: 'user',
    text: 'Add a max timeout option',
    timestamp: '11:09',
    tokens: 7,
  },
  {
    role: 'assistant',
    text: "Added `maxTimeout` — the delay is now capped:\n\n  delay = min(base * 2^attempt + jitter, maxTimeout)\n\nDefaults to 30 seconds if not specified.",
    timestamp: '11:09',
    tokens: 52,
    model: 'sonnet',
    thinking: 'Simple addition — cap the computed delay with Math.min against maxTimeout.',
  },
  {
    role: 'user',
    text: 'What about circuit breaker pattern?',
    timestamp: '11:10',
    tokens: 8,
  },
  {
    role: 'assistant',
    text: "A circuit breaker tracks failure counts and trips open after a\nthreshold. Three states:\n\n  closed  — requests pass through normally\n  open    — requests fail immediately (no retries)\n  half    — one test request allowed, success resets\n\nYou can compose it with the retry utility — retry handles\ntransient failures, circuit breaker prevents cascading ones.",
    timestamp: '11:10',
    tokens: 78,
    model: 'sonnet',
    thinking: 'Circuit breaker is complementary to retry. I\'ll explain the three states and how they compose.',
  },
]

/* ── Visibility state per part ── */

type PartVis = { type: 'user'; msg: Message } | { type: 'thinking'; text: string } | { type: 'reply'; msg: Message }

/* ── Component ── */

export function AIMessageBubbleV3() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [frame, setFrame] = useState(0)
  const [parts, setParts] = useState<PartVis[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [showThinking, setShowThinking] = useState(true)
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
    setParts([])
    setStreaming(false)
    setStreamText('')

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 300

    MESSAGES.forEach((msg) => {
      if (msg.role === 'user') {
        timers.push(setTimeout(() => {
          if (mountedRef.current) setParts(prev => [...prev, { type: 'user', msg }])
        }, delay))
        delay += 600
      } else {
        // Show thinking first
        if (msg.thinking) {
          timers.push(setTimeout(() => {
            if (mountedRef.current) setParts(prev => [...prev, { type: 'thinking', text: msg.thinking! }])
          }, delay))
          delay += 800
        }

        // Stream reply
        timers.push(setTimeout(() => {
          if (mountedRef.current) { setStreaming(true); setStreamText('') }
        }, delay))
        delay += 150
        const len = msg.text.length
        for (let c = 0; c <= len; c += 3) {
          timers.push(setTimeout(() => {
            if (mountedRef.current) setStreamText(msg.text.slice(0, c))
          }, delay + (c / 3) * 20))
        }
        delay += (len / 3) * 20 + 150
        timers.push(setTimeout(() => {
          if (mountedRef.current) {
            setStreaming(false)
            setParts(prev => [...prev, { type: 'reply', msg }])
          }
        }, delay))
        delay += 400
      }
    })

    return () => timers.forEach(clearTimeout)
  }, [ready, runId])

  useInput((ch) => {
    if (ch === 'r') setRunId(n => n + 1)
    if (ch === 't') setShowThinking(v => !v)
  })

  if (!ready) return <Box />

  const spin = SPIN[frame % SPIN.length]

  return (
    <Box flexDirection="column" paddingX={1}>
      {parts.map((part, i) => {
        if (part.type === 'user') {
          return (
            <Box key={i} marginBottom={1} gap={1}>
              <Text dimColor>{'>'}</Text>
              <Text bold>{part.msg.text}</Text>
            </Box>
          )
        }

        if (part.type === 'thinking' && showThinking) {
          return (
            <Box key={i} marginLeft={2}>
              <Text dimColor italic>{part.text}</Text>
            </Box>
          )
        }

        if (part.type === 'reply') {
          return (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Box flexDirection="column" marginLeft={2}>
                {part.msg.text.split('\n').map((line, li) => (
                  <Text key={li}>{formatLine(line, colors)}</Text>
                ))}
              </Box>
              <Box marginLeft={2} gap={1}>
                {part.msg.model && <Text dimColor>{part.msg.model}</Text>}
                {part.msg.tokens && <Text dimColor>{part.msg.tokens}t</Text>}
                <Text dimColor>{part.msg.timestamp}</Text>
              </Box>
            </Box>
          )
        }

        return null
      })}

      {/* Streaming */}
      {streaming && (
        <Box flexDirection="column" marginLeft={2} marginBottom={1}>
          <Box flexDirection="column">
            {streamText.split('\n').map((line, li) => (
              <Text key={li}>{line}</Text>
            ))}
            <Text dimColor>{spin}</Text>
          </Box>
        </Box>
      )}

      <Help keys={[
        { key: 'r', label: 'replay' },
        { key: 't', label: showThinking ? 'hide thinking' : 'show thinking' },
      ]} />
    </Box>
  )
}

/* ── Format helpers ── */

function formatLine(line: string, colors: ReturnType<typeof useTheme>) {
  if (line.includes('`') && line.split('`').length >= 3) {
    const parts = line.split('`')
    return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.info}>`{p}`</Text> : <Text key={i}>{p}</Text>)}</Text>
  }
  // Indented code-like lines
  if (/^\s{2}\S/.test(line) && (line.includes('=') || line.includes('—') || line.includes('('))) {
    return <Text color={colors.secondary}>{line}</Text>
  }
  return <Text>{line}</Text>
}
