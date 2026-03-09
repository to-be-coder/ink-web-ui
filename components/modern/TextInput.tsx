import { useReducer, useEffect, useRef, useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, GBar, HelpFooter, type BarSymbol } from './utils'

/* ── Field config ── */

interface Field {
  id: string
  label: string
  description: string
  placeholder: string
  echo: 'normal' | 'password' | 'none'
  maxLength: number
  validate?: (v: string) => string | null
  suggestions?: string[]
}

const FIELDS: Field[] = [
  {
    id: 'username', label: 'Username', description: 'Your unique handle',
    placeholder: 'johndoe', echo: 'normal', maxLength: 20,
    validate: v => !v.trim() ? 'Required' : /\s/.test(v) ? 'No spaces allowed' : v.length < 3 ? 'Min 3 characters' : null,
    suggestions: ['john', 'jane', 'admin', 'user'],
  },
  {
    id: 'email', label: 'Email', description: 'We will send a confirmation',
    placeholder: 'you@example.com', echo: 'normal', maxLength: 40,
    validate: v => !v.trim() ? 'Required' : !v.includes('@') ? 'Must contain @' : null,
  },
  {
    id: 'password', label: 'Password', description: 'Min 8 characters',
    placeholder: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', echo: 'password', maxLength: 30,
    validate: v => v.length < 8 ? 'Too short (min 8)' : null,
  },
  {
    id: 'token', label: 'API Token', description: 'Optional - for CI/CD',
    placeholder: 'sk-...', echo: 'none', maxLength: 50,
  },
]

/* ── State ── */

interface FieldState {
  value: string
  cursor: number
  error: string | null
  touched: boolean
}

interface State {
  activeField: number
  fields: Record<string, FieldState>
  submitted: boolean
}

type Action =
  | { type: 'char'; ch: string }
  | { type: 'backspace' }
  | { type: 'delete' }
  | { type: 'left' }
  | { type: 'right' }
  | { type: 'home' }
  | { type: 'end' }
  | { type: 'next_field' }
  | { type: 'prev_field' }
  | { type: 'set_error'; error: string | null }
  | { type: 'accept_suggestion'; value: string }
  | { type: 'submit' }

function getFS(state: State, id: string): FieldState {
  return state.fields[id] ?? { value: '', cursor: 0, error: null, touched: false }
}

function currentField(state: State): Field {
  return FIELDS[state.activeField]!
}

function reducer(state: State, action: Action): State {
  const field = currentField(state)
  const fs = getFS(state, field.id)

  switch (action.type) {
    case 'char': {
      if (fs.value.length >= field.maxLength) return state
      const v = fs.value.slice(0, fs.cursor) + action.ch + fs.value.slice(fs.cursor)
      return { ...state, fields: { ...state.fields, [field.id]: { ...fs, value: v, cursor: fs.cursor + 1, error: null, touched: true } } }
    }
    case 'backspace': {
      if (fs.cursor === 0) return state
      const v = fs.value.slice(0, fs.cursor - 1) + fs.value.slice(fs.cursor)
      return { ...state, fields: { ...state.fields, [field.id]: { ...fs, value: v, cursor: fs.cursor - 1, error: null } } }
    }
    case 'delete': {
      if (fs.cursor >= fs.value.length) return state
      const v = fs.value.slice(0, fs.cursor) + fs.value.slice(fs.cursor + 1)
      return { ...state, fields: { ...state.fields, [field.id]: { ...fs, value: v, error: null } } }
    }
    case 'left': return { ...state, fields: { ...state.fields, [field.id]: { ...fs, cursor: Math.max(0, fs.cursor - 1) } } }
    case 'right': return { ...state, fields: { ...state.fields, [field.id]: { ...fs, cursor: Math.min(fs.value.length, fs.cursor + 1) } } }
    case 'home': return { ...state, fields: { ...state.fields, [field.id]: { ...fs, cursor: 0 } } }
    case 'end': return { ...state, fields: { ...state.fields, [field.id]: { ...fs, cursor: fs.value.length } } }
    case 'next_field': return { ...state, activeField: Math.min(FIELDS.length - 1, state.activeField + 1) }
    case 'prev_field': return { ...state, activeField: Math.max(0, state.activeField - 1) }
    case 'set_error': return { ...state, fields: { ...state.fields, [field.id]: { ...fs, error: action.error } } }
    case 'accept_suggestion': return { ...state, fields: { ...state.fields, [field.id]: { ...fs, value: action.value, cursor: action.value.length } } }
    case 'submit': return { ...state, submitted: true }
  }
}

/* ── Display helpers ── */

function displayValue(value: string, echo: string): string {
  if (echo === 'password') return '\u2022'.repeat(value.length)
  if (echo === 'none') return value.length > 0 ? '\u2022'.repeat(3) + ' (' + value.length + ' chars)' : ''
  return value
}

function getSuggestion(value: string, suggestions?: string[]): string | null {
  if (!suggestions || !value) return null
  return suggestions.find(s => s.startsWith(value) && s !== value) ?? null
}

/* ── Main ── */

export function ModernTextInput() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, { activeField: 0, fields: {}, submitted: false })
  const [cursorVisible, setCursorVisible] = useState(true)
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    cursorRef.current = setInterval(() => setCursorVisible(v => !v), 530)
    return () => { if (cursorRef.current) clearInterval(cursorRef.current) }
  }, [])

  useInput((ch, key) => {
    if (state.submitted) return

    if (key.tab && !key.shift) {
      const field = currentField(state)
      const fs = getFS(state, field.id)
      if (field.validate && fs.touched) {
        const err = field.validate(fs.value)
        if (err) { dispatch({ type: 'set_error', error: err }); return }
      }
      if (state.activeField < FIELDS.length - 1) dispatch({ type: 'next_field' })
      return
    }
    if (key.tab && key.shift) { dispatch({ type: 'prev_field' }); return }

    if (key.return) {
      const field = currentField(state)
      const fs = getFS(state, field.id)
      // Try tab completion first
      const suggestion = field.echo === 'normal' ? getSuggestion(fs.value, field.suggestions) : null
      if (suggestion) { dispatch({ type: 'accept_suggestion', value: suggestion }); return }
      // Validate
      if (field.validate) {
        const err = field.validate(fs.value)
        if (err) { dispatch({ type: 'set_error', error: err }); return }
      }
      if (state.activeField < FIELDS.length - 1) dispatch({ type: 'next_field' })
      else dispatch({ type: 'submit' })
      return
    }

    if (key.leftArrow) { dispatch({ type: 'left' }); return }
    if (key.rightArrow) { dispatch({ type: 'right' }); return }
    if (key.backspace || key.delete) { dispatch({ type: key.backspace ? 'backspace' : 'delete' }); return }
    if (ch === '\x01') { dispatch({ type: 'home' }); return }
    if (ch === '\x05') { dispatch({ type: 'end' }); return }

    if (ch && !key.ctrl && !key.meta && !key.escape && ch.length === 1) {
      dispatch({ type: 'char', ch })
    }
  })

  if (state.submitted) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Card borderColor={colors.success}>
          <Box marginBottom={1}><Text color={colors.success} bold>{'\u2714'} Account Created</Text></Box>
          {FIELDS.map(f => {
            const fs = getFS(state, f.id)
            return (
              <Box key={f.id} gap={1}>
                <GBar kind="done" />
                <Text dimColor>{f.label}:</Text>
                <Text color={colors.info}>{displayValue(fs.value, f.echo) || '(empty)'}</Text>
              </Box>
            )
          })}
        </Card>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>Create Account</Text>
          <Box gap={1}>
            {FIELDS.map((_, i) => (
              <Text key={i} color={i === state.activeField ? colors.primary : i < state.activeField ? colors.success : 'gray'}>
                {i < state.activeField ? '\u25C7' : i === state.activeField ? '\u25C6' : '\u25CB'}
              </Text>
            ))}
          </Box>
        </Box>

        {FIELDS.map((field, i) => {
          const fs = getFS(state, field.id)
          const active = i === state.activeField
          const done = i < state.activeField
          const hasErr = active && !!fs.error
          const symbol: BarSymbol = hasErr ? 'error' : active ? 'active' : done ? 'done' : 'pending'
          const barColor = hasErr ? colors.warning : colors.primary
          const suggestion = active && field.echo === 'normal' ? getSuggestion(fs.value, field.suggestions) : null
          const displayed = displayValue(fs.value, field.echo)

          return (
            <Box key={field.id} flexDirection="column">
              <Box>
                <GBar kind={symbol} />
                <Text bold={active} color={active ? colors.primary : hasErr ? colors.warning : undefined} dimColor={!active && !done}>
                  {field.label}
                </Text>
                {done && <Text dimColor>  {displayValue(fs.value, field.echo) || '(empty)'}</Text>}
                {done && fs.value && field.validate && !field.validate(fs.value) && <Text color={colors.success}> {'\u2714'}</Text>}
              </Box>

              {active && (
                <>
                  <Box><GBar kind="bar" color={barColor} /><Text dimColor>{field.description}</Text></Box>
                  <Box>
                    <GBar kind="bar" color={barColor} />
                    <Text color={colors.primary}>{'\u276F'} </Text>
                    <Text>{displayed.slice(0, fs.cursor)}</Text>
                    <Text inverse={cursorVisible}>{displayed[fs.cursor] ?? ' '}</Text>
                    <Text>{displayed.slice(fs.cursor + 1)}</Text>
                    {suggestion && <Text dimColor>{suggestion.slice(fs.value.length)}</Text>}
                    {!fs.value && !suggestion && <Text dimColor>{field.placeholder}</Text>}
                  </Box>
                  {hasErr && <Box><GBar kind="bar" color={barColor} /><Text color={colors.error}>{fs.error}</Text></Box>}
                  {field.maxLength && (
                    <Box><GBar kind="bar" color={barColor} /><Text dimColor>{fs.value.length}/{field.maxLength}</Text></Box>
                  )}
                </>
              )}

              {i < FIELDS.length - 1 && <Text color={done ? colors.success : 'gray'}>{'\u2502'}</Text>}
            </Box>
          )
        })}

        <HelpFooter keys={[
          { key: 'tab', label: 'next' },
          { key: 'shift+tab', label: 'back' },
          { key: 'enter', label: state.activeField === FIELDS.length - 1 ? 'submit' : 'next' },
          { key: '\u2190\u2192', label: 'move cursor' },
        ]} />
      </Card>
    </Box>
  )
}
