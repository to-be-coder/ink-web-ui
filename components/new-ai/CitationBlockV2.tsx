import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

/* ── Data ── */

interface Source {
  id: number
  title: string
  url: string
  snippet: string
}

interface ResponseBlock {
  text: string
  refs: number[]
}

const SOURCES: Source[] = [
  { id: 1, title: 'MDN: WebSocket API', url: 'developer.mozilla.org/en-US/docs/Web/API/WebSocket', snippet: 'The WebSocket API makes it possible to open a two-way interactive communication session between the browser and server.' },
  { id: 2, title: 'Node.js ws library docs', url: 'github.com/websockets/ws', snippet: 'ws is a simple to use, blazing fast, and thoroughly tested WebSocket client and server implementation.' },
  { id: 3, title: 'RFC 6455: The WebSocket Protocol', url: 'datatracker.ietf.org/doc/html/rfc6455', snippet: 'The WebSocket Protocol enables two-way communication between a client and a remote host.' },
  { id: 4, title: 'Socket.IO documentation', url: 'socket.io/docs/v4', snippet: 'Socket.IO is a library that enables low-latency, bidirectional event-based communication.' },
  { id: 5, title: 'Express + WebSocket tutorial', url: 'blog.logrocket.com/websocket-tutorial', snippet: 'Learn how to integrate WebSocket connections with your existing Express.js application.' },
]

const RESPONSE: ResponseBlock[][] = [
  [
    { text: 'WebSocket enables full-duplex communication over a single TCP', refs: [1, 3] },
    { text: 'connection. The most popular Node.js implementation is the', refs: [2] },
    { text: '`ws` library, which provides a clean API for both client and', refs: [2] },
    { text: 'server usage.', refs: [] },
  ],
  [
    { text: 'For production apps, consider Socket.IO which adds automatic', refs: [4] },
    { text: 'reconnection, room support, and fallback transports.', refs: [4] },
  ],
  [
    { text: 'You can integrate WebSockets with Express by sharing the', refs: [5, 2] },
    { text: 'HTTP server instance between both frameworks.', refs: [5] },
  ],
]

/* ── Component ── */

export function NewAICitationBlockV2() {
  const colors = useTheme()
  const [view, setView] = useState<'response' | 'sources'>('response')
  const [cursor, setCursor] = useState(0)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useInput((ch, key) => {
    if (ch === 'v') {
      setView(v => v === 'response' ? 'sources' : 'response')
      setCursor(0)
    }
    if (view === 'sources') {
      if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
      if (key.downArrow || ch === 'j') setCursor(c => Math.min(SOURCES.length - 1, c + 1))
      if (key.return || ch === ' ') {
        const src = SOURCES[cursor]
        if (src) {
          setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(src.id)) next.delete(src.id)
            else next.add(src.id)
            return next
          })
        }
      }
    }
  })

  return (
    <Box flexDirection="column" padding={1}>
      {/* Tabs */}
      <Box gap={2} marginBottom={1}>
        <Text
          bold={view === 'response'}
          color={view === 'response' ? colors.primary : undefined}
          dimColor={view !== 'response'}
        >
          Response
        </Text>
        <Text dimColor>│</Text>
        <Text
          bold={view === 'sources'}
          color={view === 'sources' ? colors.primary : undefined}
          dimColor={view !== 'sources'}
        >
          Sources ({SOURCES.length})
        </Text>
      </Box>

      {view === 'response' ? (
        <Box flexDirection="column">
          {RESPONSE.map((para, pi) => (
            <Box key={pi} flexDirection="column" marginBottom={1}>
              {para.map((line, li) => (
                <Box key={li}>
                  <Text>
                    {line.text.includes('`') ? formatInline(line.text, colors) : line.text}
                  </Text>
                  {line.refs.length > 0 && (
                    <Text color={colors.info}> [{line.refs.join(',')}]</Text>
                  )}
                </Box>
              ))}
            </Box>
          ))}

        </Box>
      ) : (
        <Box flexDirection="column">
          {SOURCES.map((src, i) => {
            const selected = i === cursor
            const exp = expanded.has(src.id)

            return (
              <Box key={src.id} flexDirection="column" marginBottom={exp ? 1 : 0}>
                <Box gap={1}>
                  <Text color={selected ? colors.primary : '#555555'}>
                    {exp ? '▼' : '▶'}
                  </Text>
                  <Text color={colors.info}>[{src.id}]</Text>
                  <Text bold={selected} dimColor={!selected}>{src.title}</Text>
                </Box>
                {exp && (
                  <Box flexDirection="column" marginLeft={4}>
                    <Text dimColor color={colors.info}>{src.url}</Text>
                    <Text dimColor>{src.snippet}</Text>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      )}

      <Help keys={[
        { key: 'v', label: view === 'response' ? 'sources' : 'response' },
        ...(view === 'sources' ? [
          { key: 'j/k', label: 'navigate' },
          { key: 'enter', label: 'expand' },
        ] : []),
      ]} />
    </Box>
  )
}

function formatInline(text: string, colors: ReturnType<typeof useTheme>) {
  const parts = text.split('`')
  return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.info} bold>{p}</Text> : <Text key={i}>{p}</Text>)}</Text>
}
