import { useReducer, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// --- Echo modes (matching bubbles/textinput) ---

type EchoMode = 'normal' | 'password' | 'none'

interface InputField {
  label: string
  prompt: string
  placeholder: string
  echoMode: EchoMode
  echoChar: string
  charLimit: number
  value: string
  cursorPos: number
  suggestions: string[]
}

interface State {
  fields: InputField[]
  activeField: number
  cursorVisible: boolean
  showSuggestion: boolean
}

type Action =
  | { type: 'focus_field'; index: number }
  | { type: 'next_field' }
  | { type: 'prev_field' }
  | { type: 'insert_char'; char: string }
  | { type: 'delete_back' }
  | { type: 'delete_forward' }
  | { type: 'delete_word_back' }
  | { type: 'cursor_left' }
  | { type: 'cursor_right' }
  | { type: 'cursor_word_left' }
  | { type: 'cursor_word_right' }
  | { type: 'cursor_home' }
  | { type: 'cursor_end' }
  | { type: 'delete_to_end' }
  | { type: 'delete_to_start' }
  | { type: 'accept_suggestion' }
  | { type: 'toggle_cursor' }

function updateField(field: InputField, fn: (f: InputField) => InputField): InputField {
  return fn({ ...field })
}

function wordBoundaryBack(value: string, pos: number): number {
  let i = pos - 1
  while (i > 0 && value[i] === ' ') i--
  while (i > 0 && value[i - 1] !== ' ') i--
  return Math.max(0, i)
}

function wordBoundaryForward(value: string, pos: number): number {
  let i = pos
  while (i < value.length && value[i] === ' ') i++
  while (i < value.length && value[i] !== ' ') i++
  return i
}

function matchingSuggestion(field: InputField): string | null {
  if (field.value.length === 0) return null
  const lower = field.value.toLowerCase()
  for (const s of field.suggestions) {
    if (s.toLowerCase().startsWith(lower) && s.length > field.value.length) {
      return s
    }
  }
  return null
}

function reducer(state: State, action: Action): State {
  const { fields, activeField } = state
  const field = fields[activeField]

  function withField(fn: (f: InputField) => InputField): State {
    const next = [...fields]
    next[activeField] = updateField(field, fn)
    return { ...state, fields: next }
  }

  switch (action.type) {
    case 'focus_field':
      return { ...state, activeField: action.index }
    case 'next_field':
      return { ...state, activeField: Math.min(fields.length - 1, activeField + 1) }
    case 'prev_field':
      return { ...state, activeField: Math.max(0, activeField - 1) }
    case 'insert_char':
      return withField((f) => {
        if (f.charLimit > 0 && f.value.length >= f.charLimit) return f
        const before = f.value.slice(0, f.cursorPos)
        const after = f.value.slice(f.cursorPos)
        f.value = before + action.char + after
        f.cursorPos += action.char.length
        return f
      })
    case 'delete_back':
      return withField((f) => {
        if (f.cursorPos === 0) return f
        f.value = f.value.slice(0, f.cursorPos - 1) + f.value.slice(f.cursorPos)
        f.cursorPos--
        return f
      })
    case 'delete_forward':
      return withField((f) => {
        if (f.cursorPos >= f.value.length) return f
        f.value = f.value.slice(0, f.cursorPos) + f.value.slice(f.cursorPos + 1)
        return f
      })
    case 'delete_word_back':
      return withField((f) => {
        const target = wordBoundaryBack(f.value, f.cursorPos)
        f.value = f.value.slice(0, target) + f.value.slice(f.cursorPos)
        f.cursorPos = target
        return f
      })
    case 'cursor_left':
      return withField((f) => {
        f.cursorPos = Math.max(0, f.cursorPos - 1)
        return f
      })
    case 'cursor_right':
      return withField((f) => {
        f.cursorPos = Math.min(f.value.length, f.cursorPos + 1)
        return f
      })
    case 'cursor_word_left':
      return withField((f) => {
        f.cursorPos = wordBoundaryBack(f.value, f.cursorPos)
        return f
      })
    case 'cursor_word_right':
      return withField((f) => {
        f.cursorPos = wordBoundaryForward(f.value, f.cursorPos)
        return f
      })
    case 'cursor_home':
      return withField((f) => { f.cursorPos = 0; return f })
    case 'cursor_end':
      return withField((f) => { f.cursorPos = f.value.length; return f })
    case 'delete_to_end':
      return withField((f) => {
        f.value = f.value.slice(0, f.cursorPos)
        return f
      })
    case 'delete_to_start':
      return withField((f) => {
        f.value = f.value.slice(f.cursorPos)
        f.cursorPos = 0
        return f
      })
    case 'accept_suggestion':
      return withField((f) => {
        const sug = matchingSuggestion(f)
        if (sug) { f.value = sug; f.cursorPos = sug.length }
        return f
      })
    case 'toggle_cursor':
      return { ...state, cursorVisible: !state.cursorVisible }
  }
}

// --- Demo fields ---

const INITIAL_FIELDS: InputField[] = [
  {
    label: 'Username',
    prompt: '> ',
    placeholder: 'enter your name',
    echoMode: 'normal',
    echoChar: '*',
    charLimit: 30,
    value: '',
    cursorPos: 0,
    suggestions: ['alice', 'alice_dev', 'admin', 'bob', 'bob_smith', 'charlie'],
  },
  {
    label: 'Email',
    prompt: '> ',
    placeholder: 'user@example.com',
    echoMode: 'normal',
    echoChar: '*',
    charLimit: 50,
    value: '',
    cursorPos: 0,
    suggestions: [],
  },
  {
    label: 'Password',
    prompt: '> ',
    placeholder: 'enter password',
    echoMode: 'password',
    echoChar: '*',
    charLimit: 40,
    value: '',
    cursorPos: 0,
    suggestions: [],
  },
  {
    label: 'API Key',
    prompt: '> ',
    placeholder: 'sk-...',
    echoMode: 'none',
    echoChar: '*',
    charLimit: 60,
    value: '',
    cursorPos: 0,
    suggestions: [],
  },
]

// --- Rendering helpers ---

function echoTransform(value: string, mode: EchoMode, echoChar: string): string {
  if (mode === 'password') return echoChar.repeat(value.length)
  if (mode === 'none') return ''
  return value
}

function InputFieldView({
  field,
  focused,
  cursorVisible,
  colors,
}: {
  field: InputField
  focused: boolean
  cursorVisible: boolean
  colors: ReturnType<typeof useTheme>
}) {
  const displayed = echoTransform(field.value, field.echoMode, field.echoChar)
  const showPlaceholder = field.value.length === 0

  if (showPlaceholder && !focused) {
    return (
      <Box>
        <Text color="gray">{field.prompt}</Text>
        <Text color="gray">{field.placeholder}</Text>
      </Box>
    )
  }

  if (showPlaceholder && focused) {
    const placeholderChars = field.placeholder.split('')
    return (
      <Box>
        <Text color={colors.primary}>{field.prompt}</Text>
        <Text inverse={cursorVisible} color="gray">
          {placeholderChars[0] ?? ' '}
        </Text>
        <Text color="gray">{field.placeholder.slice(1)}</Text>
      </Box>
    )
  }

  // Render with cursor
  const pos = Math.min(field.cursorPos, displayed.length)
  const before = displayed.slice(0, pos)
  const cursorChar = pos < displayed.length ? displayed[pos] : ' '
  const after = pos < displayed.length ? displayed.slice(pos + 1) : ''

  // Suggestion rendering
  const suggestion = focused ? matchingSuggestion(field) : null
  const suggestionTail = suggestion && field.echoMode === 'normal'
    ? suggestion.slice(field.value.length)
    : ''

  return (
    <Box>
      <Text color={focused ? colors.primary : 'gray'}>{field.prompt}</Text>
      <Text>{before}</Text>
      {focused ? (
        <Text inverse={cursorVisible}>{cursorChar}</Text>
      ) : (
        <Text>{cursorChar === ' ' ? '' : cursorChar}</Text>
      )}
      <Text>{after}</Text>
      {suggestionTail && <Text color="gray">{suggestionTail}</Text>}
    </Box>
  )
}

// --- Component ---

export function TextInput() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    fields: INITIAL_FIELDS.map((f) => ({ ...f })),
    activeField: 0,
    cursorVisible: true,
    showSuggestion: false,
  })

  // Cursor blink
  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: 'toggle_cursor' }), 530)
    return () => clearInterval(timer)
  }, [])

  useInput((ch, key) => {
    // Navigation between fields
    if (key.tab || key.downArrow) {
      dispatch({ type: 'next_field' })
      return
    }
    if ((key.tab && key.shift) || key.upArrow) {
      dispatch({ type: 'prev_field' })
      return
    }

    // Editing
    if (key.backspace) {
      if (key.meta || key.ctrl) dispatch({ type: 'delete_word_back' })
      else dispatch({ type: 'delete_back' })
    } else if (key.delete) {
      dispatch({ type: 'delete_forward' })
    } else if (key.leftArrow) {
      if (key.meta || key.ctrl) dispatch({ type: 'cursor_word_left' })
      else dispatch({ type: 'cursor_left' })
    } else if (key.rightArrow) {
      if (key.meta || key.ctrl) dispatch({ type: 'cursor_word_right' })
      else dispatch({ type: 'cursor_right' })
    } else if (ch === '\t') {
      dispatch({ type: 'accept_suggestion' })
    } else if (key.ctrl && ch === 'a') {
      dispatch({ type: 'cursor_home' })
    } else if (key.ctrl && ch === 'e') {
      dispatch({ type: 'cursor_end' })
    } else if (key.ctrl && ch === 'k') {
      dispatch({ type: 'delete_to_end' })
    } else if (key.ctrl && ch === 'u') {
      dispatch({ type: 'delete_to_start' })
    } else if (ch && !key.ctrl && !key.meta && ch.length === 1 && ch >= ' ') {
      dispatch({ type: 'insert_char', char: ch })
    }
  })

  const { fields, activeField, cursorVisible } = state

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>
          TextInput
        </Text>
        <Text dimColor>Form with multiple input types</Text>
      </Box>

      {fields.map((field, i) => {
        const focused = i === activeField
        return (
          <Box key={field.label} flexDirection="column" marginBottom={i < fields.length - 1 ? 1 : 0}>
            <Box gap={1}>
              <Text color={focused ? colors.primary : 'gray'} bold={focused}>
                {focused ? '▸' : ' '} {field.label}
              </Text>
              {field.charLimit > 0 && field.value.length > 0 && (
                <Text dimColor>
                  {field.value.length}/{field.charLimit}
                </Text>
              )}
              {field.echoMode !== 'normal' && (
                <Text color={colors.secondary}>
                  [{field.echoMode}]
                </Text>
              )}
            </Box>
            <Box marginLeft={2}>
              <InputFieldView
                field={field}
                focused={focused}
                cursorVisible={cursorVisible}
                colors={colors}
              />
            </Box>
          </Box>
        )
      })}

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> ↑↓ </Text>
          <Text dimColor> field</Text>
        </Box>
        <Box>
          <Text inverse bold> ←→ </Text>
          <Text dimColor> cursor</Text>
        </Box>
        <Box>
          <Text inverse bold> tab </Text>
          <Text dimColor> complete</Text>
        </Box>
        <Box>
          <Text inverse bold> ^k/^u </Text>
          <Text dimColor> kill</Text>
        </Box>
      </Box>
    </Box>
  )
}
