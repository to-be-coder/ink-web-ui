import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

const MENU_ITEMS = ['Foreground', 'Background', 'Cursor'] as const
type ColorTarget = typeof MENU_ITEMS[number]

interface State {
  mode: 'choose' | 'input'
  menuIndex: number
  inputValue: string
  fg: string
  bg: string
  cursor: string
  error: string
}

type Action =
  | { type: 'menu_up' }
  | { type: 'menu_down' }
  | { type: 'enter_input' }
  | { type: 'exit_input' }
  | { type: 'input_char'; char: string }
  | { type: 'input_backspace' }
  | { type: 'submit' }

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'menu_up':
      return { ...state, menuIndex: (state.menuIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length }
    case 'menu_down':
      return { ...state, menuIndex: (state.menuIndex + 1) % MENU_ITEMS.length }
    case 'enter_input':
      return { ...state, mode: 'input', inputValue: '#', error: '' }
    case 'exit_input':
      return { ...state, mode: 'choose', inputValue: '', error: '' }
    case 'input_char':
      if (state.inputValue.length >= 7) return state
      return { ...state, inputValue: state.inputValue + action.char, error: '' }
    case 'input_backspace': {
      if (state.inputValue.length <= 1) return state
      return { ...state, inputValue: state.inputValue.slice(0, -1), error: '' }
    }
    case 'submit': {
      const hex = state.inputValue
      if (!isValidHex(hex)) {
        return { ...state, error: `Invalid hex color: ${hex}` }
      }
      const target = MENU_ITEMS[state.menuIndex]!
      if (target === 'Foreground') return { ...state, fg: hex, mode: 'choose', inputValue: '', error: '' }
      if (target === 'Background') return { ...state, bg: hex, mode: 'choose', inputValue: '', error: '' }
      return { ...state, cursor: hex, mode: 'choose', inputValue: '', error: '' }
    }
  }
}

export function ColorPicker() {
  const colors = useTheme()

  const [state, dispatch] = useReducer(reducer, {
    mode: 'choose',
    menuIndex: 0,
    inputValue: '',
    fg: '#FFFFFF',
    bg: '#000000',
    cursor: '#FF71CE',
    error: '',
  })

  const { mode, menuIndex, inputValue, fg, bg, cursor, error } = state

  useInput((ch, key) => {
    if (mode === 'choose') {
      if (ch === 'j' || key.downArrow) dispatch({ type: 'menu_down' })
      else if (ch === 'k' || key.upArrow) dispatch({ type: 'menu_up' })
      else if (key.return) dispatch({ type: 'enter_input' })
    } else {
      if (key.escape) dispatch({ type: 'exit_input' })
      else if (key.return) dispatch({ type: 'submit' })
      else if (key.backspace || key.delete) dispatch({ type: 'input_backspace' })
      else if (ch && !key.ctrl && !key.meta && ch.length === 1) {
        dispatch({ type: 'input_char', char: ch })
      }
    }
  })

  const colorValues: Record<ColorTarget, string> = {
    Foreground: fg,
    Background: bg,
    Cursor: cursor,
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>ColorPicker</Text>
        <Text dimColor>{mode === 'choose' ? 'select a target' : `editing ${MENU_ITEMS[menuIndex]}`}</Text>
      </Box>

      {mode === 'choose' ? (
        <>
          <Box marginBottom={1}>
            <Text dimColor>Choose a color to change:</Text>
          </Box>

          {MENU_ITEMS.map((item, i) => {
            const isActive = i === menuIndex
            const colorVal = colorValues[item]
            return (
              <Box key={item} gap={1}>
                <Text color={isActive ? colors.primary : 'gray'}>
                  {isActive ? '▸' : ' '}
                </Text>
                <Box width={14}>
                  <Text
                    color={isActive ? 'white' : undefined}
                    bold={isActive}
                  >
                    {item}
                  </Text>
                </Box>
                <Text backgroundColor={colorVal} color={colorVal === bg ? fg : bg}>
                  {'  '}
                </Text>
                <Text dimColor> {colorVal}</Text>
              </Box>
            )
          })}

          {/* Live preview */}
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>Preview:</Text>
            <Box>
              <Text backgroundColor={bg} color={fg}>
                {'  Sample text  '}
              </Text>
              <Text> </Text>
              <Text backgroundColor={cursor} color={bg === cursor ? fg : 'black'}>
                {'▊'}
              </Text>
              <Text dimColor> cursor</Text>
            </Box>
          </Box>

          <Box marginTop={1} gap={2}>
            <Box>
              <Text inverse bold> j/k </Text>
              <Text dimColor> navigate</Text>
            </Box>
            <Box>
              <Text inverse bold> enter </Text>
              <Text dimColor> edit</Text>
            </Box>
          </Box>
        </>
      ) : (
        <>
          <Box marginBottom={1}>
            <Text>Enter a hex color for </Text>
            <Text bold color={colors.info}>{MENU_ITEMS[menuIndex]}</Text>
            <Text>:</Text>
          </Box>

          <Box gap={1}>
            <Text color={colors.primary}>{'\u276F'} </Text>
            <Text>{inputValue}</Text>
            <Text color="gray">_</Text>
          </Box>

          {inputValue.length === 7 && (
            <Box marginTop={1} gap={1}>
              <Text dimColor>Preview: </Text>
              <Text backgroundColor={isValidHex(inputValue) ? inputValue : '#000000'}>
                {'      '}
              </Text>
            </Box>
          )}

          {error && (
            <Box marginTop={1}>
              <Text color={colors.error}>{error}</Text>
            </Box>
          )}

          <Box marginTop={1} gap={2}>
            <Box>
              <Text inverse bold> enter </Text>
              <Text dimColor> submit</Text>
            </Box>
            <Box>
              <Text inverse bold> esc </Text>
              <Text dimColor> back</Text>
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}
