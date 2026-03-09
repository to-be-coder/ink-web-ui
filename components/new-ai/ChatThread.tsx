import { useState, useEffect, useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Sep, SPIN, Badge } from './utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  variants?: string[]
  variantIdx?: number
  tokens?: number
  model?: string
  timestamp: string
}

const THREAD: Message[] = [
  {
    id: '1', role: 'user',
    text: 'How do I set up a WebSocket server in Node.js?',
    timestamp: '10:24 AM', tokens: 14,
  },
  {
    id: '2', role: 'assistant',
    text: "Here's a minimal WebSocket server using the `ws` library:\n\n```\nimport { WebSocketServer } from 'ws'\nconst wss = new WebSocketServer({ port: 8080 })\n\nwss.on('connection', (ws) => {\n  ws.on('message', (data) => {\n    console.log('received: %s', data)\n    ws.send(`echo: ${data}`)\n  })\n  ws.send('connected')\n})\n```\n\nInstall with `npm install ws` and run it.",
    variants: [
      "Here's a minimal WebSocket server using the `ws` library:\n\n```\nimport { WebSocketServer } from 'ws'\nconst wss = new WebSocketServer({ port: 8080 })\n\nwss.on('connection', (ws) => {\n  ws.on('message', (data) => {\n    console.log('received: %s', data)\n    ws.send(`echo: ${data}`)\n  })\n  ws.send('connected')\n})\n```\n\nInstall with `npm install ws` and run it.",
      "You can use Node's built-in `http` module with `ws`:\n\n```\nimport http from 'http'\nimport { WebSocketServer } from 'ws'\n\nconst server = http.createServer()\nconst wss = new WebSocketServer({ server })\n\nwss.on('connection', (ws) => {\n  ws.on('message', (msg) => ws.send(msg))\n})\n\nserver.listen(3000)\n```\n\nThis approach lets you share a port with Express.",
    ],
    variantIdx: 0,
    timestamp: '10:24 AM', tokens: 87, model: 'opus-4',
  },
  {
    id: '3', role: 'user',
    text: 'How do I add authentication to it?',
    timestamp: '10:25 AM', tokens: 10,
  },
  {
    id: '4', role: 'assistant',
    text: "Add token verification in the `connection` handler:\n\n```\nwss.on('connection', (ws, req) => {\n  const url = new URL(req.url, 'http://localhost')\n  const token = url.searchParams.get('token')\n  if (!verifyToken(token)) {\n    ws.close(4001, 'Unauthorized')\n    return\n  }\n  // authenticated — proceed\n})\n```\n\nPass the token as a query param: `ws://host:8080?token=xxx`",
    timestamp: '10:25 AM', tokens: 64, model: 'opus-4',
  },
]

type State = {
  messages: Message[]
  cursor: number
  editing: boolean
  editText: string
  streaming: boolean
  streamText: string
}

type Action =
  | { type: 'MOVE'; dir: -1 | 1 }
  | { type: 'VARIANT'; dir: -1 | 1 }
  | { type: 'START_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'EDIT_CHAR'; ch: string }
  | { type: 'EDIT_BACKSPACE' }
  | { type: 'STREAM_TICK'; text: string }
  | { type: 'STREAM_DONE' }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'MOVE': {
      const next = s.cursor + a.dir
      if (next < 0 || next >= s.messages.length) return s
      return { ...s, cursor: next, editing: false }
    }
    case 'VARIANT': {
      const msg = s.messages[s.cursor]!
      if (!msg.variants || msg.variants.length <= 1) return s
      const idx = ((msg.variantIdx ?? 0) + a.dir + msg.variants.length) % msg.variants.length
      const updated = [...s.messages]
      updated[s.cursor] = { ...msg, variantIdx: idx, text: msg.variants[idx]! }
      return { ...s, messages: updated }
    }
    case 'START_EDIT': {
      const msg = s.messages[s.cursor]!
      if (msg.role !== 'user') return s
      return { ...s, editing: true, editText: msg.text }
    }
    case 'CANCEL_EDIT':
      return { ...s, editing: false }
    case 'EDIT_CHAR':
      return { ...s, editText: s.editText + a.ch }
    case 'EDIT_BACKSPACE':
      return { ...s, editText: s.editText.slice(0, -1) }
    case 'STREAM_TICK':
      return { ...s, streaming: true, streamText: a.text }
    case 'STREAM_DONE':
      return { ...s, streaming: false, streamText: '' }
    default: return s
  }
}

export function NewAIChatThread() {
  const colors = useTheme()
  const [frame, setFrame] = useState(0)
  const [state, dispatch] = useReducer(reducer, {
    messages: THREAD,
    cursor: 0,
    editing: false,
    editText: '',
    streaming: false,
    streamText: '',
  })

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useInput((ch, key) => {
    if (state.editing) {
      if (key.escape) dispatch({ type: 'CANCEL_EDIT' })
      else if (key.backspace || key.delete) dispatch({ type: 'EDIT_BACKSPACE' })
      else if (ch && !key.ctrl && !key.meta && !key.return) dispatch({ type: 'EDIT_CHAR', ch })
      return
    }
    if (key.upArrow || ch === 'k') dispatch({ type: 'MOVE', dir: -1 })
    if (key.downArrow || ch === 'j') dispatch({ type: 'MOVE', dir: 1 })
    if (key.leftArrow || ch === 'h') dispatch({ type: 'VARIANT', dir: -1 })
    if (key.rightArrow || ch === 'l') dispatch({ type: 'VARIANT', dir: 1 })
    if (ch === 'e') dispatch({ type: 'START_EDIT' })
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} gap={1}>
        <Badge label="Thread" color={colors.primary} />
        <Text dimColor>{state.messages.length} messages</Text>
      </Box>

      {state.messages.map((msg, i) => {
        const selected = i === state.cursor
        const isUser = msg.role === 'user'
        const accent = isUser ? colors.warning : colors.info

        return (
          <Box key={msg.id} flexDirection="column" marginBottom={1}>
            {/* Gutter + header */}
            <Box gap={1}>
              <Text color={selected ? colors.primary : undefined}>
                {selected ? '▸' : ' '}
              </Text>
              <Text bold color={accent}>
                {isUser ? '◆ You' : '◇ Assistant'}
              </Text>
              <Text dimColor>{msg.timestamp}</Text>
              {msg.tokens && <Text dimColor>· {msg.tokens}t</Text>}
              {msg.model && <Text dimColor color={colors.secondary}>· {msg.model}</Text>}
              {msg.variants && msg.variants.length > 1 && (
                <Text color={colors.primary}>
                  ‹ {(msg.variantIdx ?? 0) + 1}/{msg.variants.length} ›
                </Text>
              )}
            </Box>

            {/* Body */}
            <Box marginLeft={3} flexDirection="column">
              {state.editing && selected ? (
                <Box>
                  <Text color={colors.warning}>{state.editText}</Text>
                  <Text color={colors.primary}>█</Text>
                  <Text dimColor> (esc to cancel)</Text>
                </Box>
              ) : (
                msg.text.split('\n').map((line, li) => (
                  <Text key={li} dimColor={!selected && !isUser}>
                    {renderLine(line, colors, selected)}
                  </Text>
                ))
              )}
            </Box>
          </Box>
        )
      })}

      {state.streaming && (
        <Box flexDirection="column" marginBottom={1}>
          <Box gap={1}>
            <Text> </Text>
            <Text bold color={colors.info}>◇ Assistant</Text>
            <Text color={colors.primary}>{SPIN[frame % SPIN.length]}</Text>
          </Box>
          <Box marginLeft={3}>
            <Text>{state.streamText}</Text>
          </Box>
        </Box>
      )}

      <Sep />
      <Help keys={[
        { key: 'j/k', label: 'navigate' },
        { key: '◁/▷', label: 'variants' },
        { key: 'e', label: 'edit' },
      ]} />
    </Box>
  )
}

function renderLine(line: string, colors: ReturnType<typeof useTheme>, bright: boolean) {
  if (line.startsWith('```')) return <Text color={colors.secondary}>{'─'.repeat(40)}</Text>
  if (line.includes('`')) {
    const parts = line.split('`')
    return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.info} bold>{p}</Text> : <Text key={i}>{p}</Text>)}</Text>
  }
  return <Text>{line}</Text>
}
