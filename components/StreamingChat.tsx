import { useReducer, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

type Role = 'user' | 'assistant' | 'tool'

interface ToolCall {
  name: string
  input: string
  output: string
}

interface Message {
  id: number
  role: Role
  content: string
  toolCall?: ToolCall
  streaming?: boolean
}

interface State {
  messages: Message[]
  streaming: boolean
  streamBuffer: string
  streamIndex: number
  demoStep: number
  inputMode: boolean
  inputBuffer: string
  scrollOffset: number
  autoScroll: boolean
}

type Action =
  | { type: 'start_demo_step' }
  | { type: 'add_message'; message: Message }
  | { type: 'stream_tick' }
  | { type: 'finish_stream' }
  | { type: 'enter_input' }
  | { type: 'exit_input' }
  | { type: 'input_char'; char: string }
  | { type: 'input_backspace' }
  | { type: 'submit_input' }
  | { type: 'scroll_up' }
  | { type: 'scroll_down'; maxOffset: number }
  | { type: 'scroll_bottom'; maxOffset: number }
  | { type: 'reset' }

const DEMO_CONVERSATION: { role: Role; content: string; toolCall?: ToolCall }[] = [
  {
    role: 'user',
    content: 'Add rate limiting to the login endpoint',
  },
  {
    role: 'assistant',
    content: "I'll add rate limiting to prevent brute force attacks. Let me first check the current auth implementation.",
  },
  {
    role: 'tool',
    content: '',
    toolCall: {
      name: 'read_file',
      input: 'src/auth.ts',
      output: 'export async function login(email, password) {\n  const user = await db.findUser(email);\n  if (!user) throw new AuthError("not found");\n  const valid = await hash.compare(password, user.hash);\n  if (!valid) throw new AuthError("invalid");\n  return generateToken(user);\n}',
    },
  },
  {
    role: 'assistant',
    content: "I see the login function has no rate limiting. I'll add a sliding window rate limiter that blocks after 5 failed attempts within 15 minutes.",
  },
  {
    role: 'tool',
    content: '',
    toolCall: {
      name: 'edit_file',
      input: 'src/auth.ts (add rateLimit import and check)',
      output: 'Applied 2 changes to src/auth.ts (+12 -1)',
    },
  },
  {
    role: 'tool',
    content: '',
    toolCall: {
      name: 'run_command',
      input: 'npm test -- --filter auth',
      output: 'PASS tests/auth.test.ts (4 tests passed, 0 failed)',
    },
  },
  {
    role: 'assistant',
    content: "Done. I've added rate limiting to the login endpoint:\n\n- Import `rateLimit` from the middleware module\n- Check rate limit before password verification\n- Record failed attempts with `rateLimit.record(email)`\n- Block after 5 failed attempts in a 15-minute window\n- All 4 existing tests pass, including the new rate limit test",
  },
]

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start_demo_step': {
      if (state.demoStep >= DEMO_CONVERSATION.length) return state
      const step = DEMO_CONVERSATION[state.demoStep]!
      const msg: Message = {
        id: Date.now(),
        role: step.role,
        content: step.role === 'assistant' ? '' : step.content,
        toolCall: step.toolCall,
        streaming: step.role === 'assistant',
      }
      return {
        ...state,
        messages: [...state.messages, msg],
        streaming: step.role === 'assistant',
        streamBuffer: step.content,
        streamIndex: 0,
        demoStep: step.role === 'assistant' ? state.demoStep : state.demoStep + 1,
      }
    }
    case 'stream_tick': {
      if (!state.streaming || state.streamIndex >= state.streamBuffer.length) return state
      const nextIdx = Math.min(state.streamIndex + 2, state.streamBuffer.length)
      const msgs = [...state.messages]
      const last = { ...msgs[msgs.length - 1]! }
      last.content = state.streamBuffer.slice(0, nextIdx)
      msgs[msgs.length - 1] = last
      return { ...state, messages: msgs, streamIndex: nextIdx }
    }
    case 'finish_stream': {
      const msgs = [...state.messages]
      const last = { ...msgs[msgs.length - 1]! }
      last.content = state.streamBuffer
      last.streaming = false
      msgs[msgs.length - 1] = last
      return {
        ...state,
        messages: msgs,
        streaming: false,
        demoStep: state.demoStep + 1,
      }
    }
    case 'enter_input':
      return { ...state, inputMode: true, inputBuffer: '' }
    case 'exit_input':
      return { ...state, inputMode: false }
    case 'input_char':
      return { ...state, inputBuffer: state.inputBuffer + action.char }
    case 'input_backspace':
      return { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }
    case 'submit_input': {
      if (!state.inputBuffer.trim()) return { ...state, inputMode: false }
      const msg: Message = {
        id: Date.now(),
        role: 'user',
        content: state.inputBuffer.trim(),
      }
      return {
        ...state,
        messages: [...state.messages, msg],
        inputMode: false,
        inputBuffer: '',
      }
    }
    case 'add_message':
      return { ...state, messages: [...state.messages, action.message] }
    case 'scroll_up':
      return { ...state, scrollOffset: Math.max(0, state.scrollOffset - 1), autoScroll: false }
    case 'scroll_down':
      return {
        ...state,
        scrollOffset: Math.min(state.scrollOffset + 1, action.maxOffset),
        autoScroll: state.scrollOffset + 1 >= action.maxOffset,
      }
    case 'scroll_bottom':
      return { ...state, scrollOffset: action.maxOffset, autoScroll: true }
    case 'reset':
      return {
        messages: [],
        streaming: false,
        streamBuffer: '',
        streamIndex: 0,
        demoStep: 0,
        inputMode: false,
        inputBuffer: '',
        scrollOffset: 0,
        autoScroll: true,
      }
  }
}

function ToolCallBlock({ toolCall }: { toolCall: ToolCall }) {
  const colors = useTheme()
  return (
    <Box flexDirection="column" marginLeft={2}>
      <Box gap={1}>
        <Text color={colors.secondary} bold>{toolCall.name}</Text>
        <Text dimColor>{toolCall.input}</Text>
      </Box>
      {toolCall.output.split('\n').map((line, i) => (
        <Box key={i} marginLeft={2}>
          <Text color="gray">{line}</Text>
        </Box>
      ))}
    </Box>
  )
}

function MessageBlock({ message }: { message: Message }) {
  const colors = useTheme()
  if (message.role === 'tool' && message.toolCall) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box gap={1}>
          <Text color={colors.secondary}>{'>'}</Text>
          <Text color={colors.secondary} dimColor>tool</Text>
        </Box>
        <ToolCallBlock toolCall={message.toolCall} />
      </Box>
    )
  }

  const roleColor = message.role === 'user' ? colors.success : colors.primary
  const roleLabel = message.role === 'user' ? 'you' : 'assistant'
  const indicator = message.streaming ? '...' : ''

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1}>
        <Text color={roleColor} bold>{roleLabel}</Text>
        {message.streaming && <Text color={colors.warning}>{'|'}</Text>}
      </Box>
      {message.content.split('\n').map((line, i) => (
        <Box key={i} marginLeft={2}>
          <Text>{line}{i === message.content.split('\n').length - 1 ? indicator : ''}</Text>
        </Box>
      ))}
    </Box>
  )
}

const VISIBLE_LINES = 16

export function StreamingChat() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    streaming: false,
    streamBuffer: '',
    streamIndex: 0,
    demoStep: 0,
    inputMode: false,
    inputBuffer: '',
    scrollOffset: 0,
    autoScroll: true,
  })

  const { messages, streaming, streamIndex, streamBuffer, demoStep, inputMode, inputBuffer } = state

  // Streaming effect
  useEffect(() => {
    if (!streaming) return
    if (streamIndex >= streamBuffer.length) {
      const timer = setTimeout(() => dispatch({ type: 'finish_stream' }), 300)
      return () => clearTimeout(timer)
    }
    const timer = setInterval(() => dispatch({ type: 'stream_tick' }), 30)
    return () => clearInterval(timer)
  }, [streaming, streamIndex, streamBuffer.length])

  // Auto-advance non-assistant messages
  useEffect(() => {
    if (streaming) return
    if (demoStep > 0 && demoStep < DEMO_CONVERSATION.length) {
      const next = DEMO_CONVERSATION[demoStep]
      if (next && next.role !== 'user') {
        const timer = setTimeout(() => dispatch({ type: 'start_demo_step' }), 500)
        return () => clearTimeout(timer)
      }
    }
  }, [streaming, demoStep])

  useInput((ch, key) => {
    if (inputMode) {
      if (key.escape) dispatch({ type: 'exit_input' })
      else if (key.return) dispatch({ type: 'submit_input' })
      else if (key.backspace || key.delete) dispatch({ type: 'input_backspace' })
      else if (ch && !key.ctrl && !key.meta) dispatch({ type: 'input_char', char: ch })
      return
    }

    if (ch === ' ' && !streaming) dispatch({ type: 'start_demo_step' })
    else if (ch === 'i') dispatch({ type: 'enter_input' })
    else if (ch === 'j' || key.downArrow) dispatch({ type: 'scroll_down', maxOffset: Math.max(0, messages.length - 3) })
    else if (ch === 'k' || key.upArrow) dispatch({ type: 'scroll_up' })
    else if (ch === 'G') dispatch({ type: 'scroll_bottom', maxOffset: Math.max(0, messages.length - 3) })
    else if (ch === 'r') dispatch({ type: 'reset' })
  })

  const doneDemo = demoStep >= DEMO_CONVERSATION.length
  const visibleMessages = state.autoScroll
    ? messages.slice(-6)
    : messages.slice(state.scrollOffset, state.scrollOffset + 6)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Streaming Chat</Text>
        {streaming && <Text color={colors.warning}>streaming</Text>}
        {doneDemo && !streaming && <Text color={colors.success}>complete</Text>}
        <Text dimColor>{messages.length} messages</Text>
      </Box>

      <Box flexDirection="column">
        {visibleMessages.map(msg => (
          <MessageBlock key={msg.id} message={msg} />
        ))}
        {messages.length === 0 && (
          <Box marginBottom={1}>
            <Text dimColor>  Press space to start the conversation.</Text>
          </Box>
        )}
      </Box>

      {inputMode && (
        <Box marginTop={0}>
          <Text color={colors.success} bold>{'> '}</Text>
          <Text>{inputBuffer}</Text>
          <Text color="gray">_</Text>
        </Box>
      )}

      <Box marginTop={1} gap={2}>
        {!streaming && !doneDemo && (
          <Box>
            <Text inverse bold> space </Text>
            <Text dimColor> next</Text>
          </Box>
        )}
        <Box>
          <Text inverse bold> i </Text>
          <Text dimColor> type</Text>
        </Box>
        <Box>
          <Text inverse bold> j/k </Text>
          <Text dimColor> scroll</Text>
        </Box>
        <Box>
          <Text inverse bold> r </Text>
          <Text dimColor> reset</Text>
        </Box>
      </Box>
    </Box>
  )
}
