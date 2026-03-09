import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep } from './utils'

interface Source {
  id: number
  title: string
  url: string
  snippet: string
  relevance: number
}

const SOURCES: Source[] = [
  { id: 1, title: 'MDN: WebSocket API', url: 'developer.mozilla.org/en-US/docs/Web/API/WebSocket', snippet: 'The WebSocket API makes it possible to open a two-way interactive communication session between the browser and server.', relevance: 95 },
  { id: 2, title: 'Node.js ws library docs', url: 'github.com/websockets/ws', snippet: 'ws is a simple to use, blazing fast, and thoroughly tested WebSocket client and server implementation.', relevance: 92 },
  { id: 3, title: 'RFC 6455: The WebSocket Protocol', url: 'datatracker.ietf.org/doc/html/rfc6455', snippet: 'The WebSocket Protocol enables two-way communication between a client and a remote host.', relevance: 78 },
  { id: 4, title: 'Socket.IO documentation', url: 'socket.io/docs/v4', snippet: 'Socket.IO is a library that enables low-latency, bidirectional event-based communication.', relevance: 71 },
  { id: 5, title: 'Express + WebSocket tutorial', url: 'blog.logrocket.com/websocket-tutorial', snippet: 'Learn how to integrate WebSocket connections with your existing Express.js application.', relevance: 85 },
]

const RESPONSE_LINES = [
  { text: 'WebSocket enables full-duplex communication over a single TCP', refs: [1, 3] },
  { text: 'connection. The most popular Node.js implementation is the', refs: [2] },
  { text: '`ws` library, which provides a clean API for both client and', refs: [2] },
  { text: 'server usage.', refs: [] },
  { text: '' },
  { text: 'For production apps, consider Socket.IO which adds automatic', refs: [4] },
  { text: 'reconnection, room support, and fallback transports.', refs: [4] },
  { text: '' },
  { text: 'You can integrate WebSockets with Express by sharing the', refs: [5, 2] },
  { text: 'HTTP server instance between both frameworks.', refs: [5] },
]

export function NewAICitationBlock() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState<'response' | 'sources'>('response')

  useInput((ch, key) => {
    if (ch === 'v') setView(v => v === 'response' ? 'sources' : 'response')
    if (view === 'sources') {
      if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
      if (key.downArrow || ch === 'j') setCursor(c => Math.min(SOURCES.length - 1, c + 1))
      if (key.return || ch === ' ') setExpanded(e => !e)
    }
  })

  return (
    <Box flexDirection="column" padding={1}>
      {/* Tab bar */}
      <Box gap={2} marginBottom={1}>
        <Text
          bold={view === 'response'}
          color={view === 'response' ? colors.primary : undefined}
          dimColor={view !== 'response'}
          underline={view === 'response'}
        >
          ◇ Response
        </Text>
        <Text
          bold={view === 'sources'}
          color={view === 'sources' ? colors.primary : undefined}
          dimColor={view !== 'sources'}
          underline={view === 'sources'}
        >
          ◆ Sources ({SOURCES.length})
        </Text>
      </Box>

      <Sep />

      {view === 'response' ? (
        <Box flexDirection="column" marginTop={1}>
          {RESPONSE_LINES.map((line, i) => (
            <Box key={i}>
              <Text>
                {line.text?.includes('`') ? renderInlineCode(line.text, colors) : (line.text ?? '')}
              </Text>
              {line.refs && line.refs.length > 0 && (
                <Text color={colors.info} bold>
                  {' '}[{line.refs.join(',')}]
                </Text>
              )}
            </Box>
          ))}

          {/* Inline source chips */}
          <Box marginTop={1} gap={1} flexWrap="wrap">
            {SOURCES.slice(0, 3).map(src => (
              <Box key={src.id} gap={0}>
                <Text color={colors.info} bold>[{src.id}]</Text>
                <Text dimColor> {src.title}</Text>
              </Box>
            ))}
            <Text dimColor>+{SOURCES.length - 3} more</Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {SOURCES.map((src, i) => {
            const selected = i === cursor
            const relColor = src.relevance >= 90 ? colors.success
              : src.relevance >= 80 ? colors.info
              : src.relevance >= 70 ? colors.warning
              : colors.error

            return (
              <Box key={src.id} flexDirection="column" marginBottom={selected && expanded ? 1 : 0}>
                <Box gap={1}>
                  <Text color={selected ? colors.primary : undefined}>
                    {selected ? '▸' : ' '}
                  </Text>
                  <Text color={colors.info} bold>[{src.id}]</Text>
                  <Text bold={selected}>{src.title}</Text>
                  <Box>
                    <Text color={relColor}>{'█'.repeat(Math.round(src.relevance / 10))}</Text>
                    <Text dimColor>{'░'.repeat(10 - Math.round(src.relevance / 10))}</Text>
                  </Box>
                  <Text dimColor>{src.relevance}%</Text>
                </Box>

                {selected && expanded && (
                  <Box flexDirection="column" marginLeft={4}>
                    <Text dimColor color={colors.info}>↳ {src.url}</Text>
                    <Text dimColor>{src.snippet}</Text>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      )}

      <Help keys={[
        { key: 'v', label: 'toggle view' },
        ...(view === 'sources' ? [
          { key: 'j/k', label: 'navigate' },
          { key: '⏎', label: 'expand' },
        ] : []),
      ]} />
    </Box>
  )
}

function renderInlineCode(text: string, colors: ReturnType<typeof useTheme>) {
  const parts = text.split('`')
  return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.info} bold>{p}</Text> : <Text key={i}>{p}</Text>)}</Text>
}
