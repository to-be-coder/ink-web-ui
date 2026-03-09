import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from '../theme'
import { Help, SPIN } from './utils'

/* ── Types ── */

interface Reaction { emoji: string; count: number }

interface Message {
  role: 'user' | 'assistant'
  text: string
  tokens?: number
  timestamp: string
  model?: string
  reactions?: Reaction[]
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  replyTo?: string
}

/* ── Data ── */

const MESSAGES: Message[] = [
  {
    role: 'user',
    text: 'What\'s the difference between map and flatMap?',
    timestamp: '4:12 PM',
    tokens: 10,
    status: 'read',
  },
  {
    role: 'assistant',
    text: '`map` transforms each element 1:1.\n`flatMap` transforms and flattens one level.\n\n  [1,2,3].map(x => [x, x*2])\n  // [[1,2], [2,4], [3,6]]\n\n  [1,2,3].flatMap(x => [x, x*2])\n  // [1, 2, 2, 4, 3, 6]',
    timestamp: '4:12 PM',
    tokens: 68,
    model: 'opus-4',
    reactions: [{ emoji: '+1', count: 1 }],
  },
  {
    role: 'user',
    text: 'What about for Promises / async?',
    timestamp: '4:13 PM',
    tokens: 8,
    status: 'read',
    replyTo: 'What\'s the difference between map and flatMap?',
  },
  {
    role: 'assistant',
    text: 'For Promises, there\'s no built-in flatMap, but `.then()`\nnaturally flattens — returning a Promise inside `.then()`\ndoesn\'t create a nested `Promise<Promise<T>>`.\n\nFor arrays of Promises:\n\n  Promise.all(ids.map(fetchUser))        // parallel\n  for await (const u of ids.map(fetch))  // sequential\n\nIf you need both transform + flatten with async:\n\n  const results = await Promise.all(\n    items.flatMap(item => processAsync(item))\n  )',
    timestamp: '4:13 PM',
    tokens: 118,
    model: 'opus-4',
    reactions: [{ emoji: '+1', count: 2 }, { emoji: 'brain', count: 1 }],
  },
]

/* ── Status indicator ── */

function statusIcon(status?: string): string {
  switch (status) {
    case 'sending': return '...'
    case 'sent': return 'v'
    case 'delivered': return 'vv'
    case 'read': return 'vv'
    default: return ''
  }
}

/* ── Component ── */

export function AIMessageBubbleV4() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [frame, setFrame] = useState(0)
  const [visible, setVisible] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [streamIdx, setStreamIdx] = useState(0)
  const [cursor, setCursor] = useState(0)
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
    setCursor(0)

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 400

    MESSAGES.forEach((msg, i) => {
      if (msg.role === 'user') {
        timers.push(setTimeout(() => {
          if (mountedRef.current) setVisible(prev => [...prev, msg])
        }, delay))
        delay += 700
      } else {
        timers.push(setTimeout(() => {
          if (mountedRef.current) { setStreaming(true); setStreamText(''); setStreamIdx(i) }
        }, delay))
        delay += 200
        const len = msg.text.length
        for (let c = 0; c <= len; c += 3) {
          timers.push(setTimeout(() => {
            if (mountedRef.current) setStreamText(msg.text.slice(0, c))
          }, delay + (c / 3) * 18))
        }
        delay += (len / 3) * 18 + 200
        timers.push(setTimeout(() => {
          if (mountedRef.current) { setStreaming(false); setVisible(prev => [...prev, msg]) }
        }, delay))
        delay += 500
      }
    })

    return () => timers.forEach(clearTimeout)
  }, [ready, runId])

  useInput((ch, key) => {
    if (ch === 'r') setRunId(n => n + 1)
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(visible.length - 1, c + 1))
  })

  if (!ready) return <Box />

  const spin = SPIN[frame % SPIN.length]
  const currentStream = streaming ? MESSAGES[streamIdx] : null

  return (
    <Box flexDirection="column" paddingX={1}>
      {visible.map((msg, i) => {
        const isUser = msg.role === 'user'
        const selected = i === cursor
        const accent = isUser ? colors.warning : colors.primary

        return (
          <Box key={i} flexDirection="column" marginBottom={1}>
            {/* Reply indicator */}
            {msg.replyTo && (
              <Box marginLeft={3} marginBottom={0}>
                <Text dimColor>{'  ╭ '}{msg.replyTo.slice(0, 40)}{msg.replyTo.length > 40 ? '...' : ''}</Text>
              </Box>
            )}

            {/* Main row */}
            <Box gap={1}>
              <Text color={selected ? accent : '#444444'}>
                {selected ? '>' : ' '}
              </Text>
              <Text bold color={accent}>
                {isUser ? 'you' : 'ai'}
              </Text>
              <Box flexDirection="column" flexGrow={1}>
                {msg.text.split('\n').map((line, li) => (
                  <Text key={li}>{formatLine(line, colors)}</Text>
                ))}
              </Box>
            </Box>

            {/* Footer: meta + reactions */}
            <Box marginLeft={5} gap={1}>
              <Text dimColor>{msg.timestamp}</Text>
              {msg.model && <Text dimColor>{msg.model}</Text>}
              {msg.tokens && <Text dimColor>{msg.tokens}t</Text>}
              {msg.status && (
                <Text color={msg.status === 'read' ? colors.info : undefined} dimColor={msg.status !== 'read'}>
                  {statusIcon(msg.status)}
                </Text>
              )}
              {msg.reactions && msg.reactions.map((r, ri) => (
                <Text key={ri} dimColor>
                  {r.emoji === '+1' ? '+1' : r.emoji === 'brain' ? '*' : r.emoji}{r.count > 1 ? ` ${r.count}` : ''}
                </Text>
              ))}
            </Box>
          </Box>
        )
      })}

      {/* Streaming */}
      {currentStream && (
        <Box flexDirection="column" marginBottom={1}>
          <Box gap={1}>
            <Text> </Text>
            <Text bold color={colors.primary}>ai</Text>
            <Box flexDirection="column" flexGrow={1}>
              {streamText.split('\n').map((line, li) => (
                <Text key={li}>{line}</Text>
              ))}
            </Box>
          </Box>
          <Box marginLeft={5}>
            <Text color={colors.primary}>{spin}</Text>
          </Box>
        </Box>
      )}

      <Help keys={[
        { key: 'j/k', label: 'navigate' },
        { key: 'r', label: 'replay' },
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
  if (/^\s{2}\/\//.test(line)) {
    return <Text dimColor>{line}</Text>
  }
  if (/^\s{2}\S/.test(line) && !line.trim().startsWith('//')) {
    return <Text color={colors.secondary}>{line}</Text>
  }
  return <Text>{line}</Text>
}
