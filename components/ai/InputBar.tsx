import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

const SLASH_COMMANDS = ['/help', '/model', '/clear', '/compact', '/cost', '/diff']
const FILE_SUGGESTIONS = ['src/index.ts', 'src/routes.ts', 'src/auth.ts', 'src/app.ts']

export function AIInputBar() {
  const colors = useTheme()
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([
    'Add auth to routes',
    'Fix the failing test',
  ])
  const [histIdx, setHistIdx] = useState(-1)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [sugIdx, setSugIdx] = useState(0)
  const [submitted, setSubmitted] = useState<string[]>([])

  // Auto-complete suggestions
  useEffect(() => {
    if (value.startsWith('/')) {
      const matches = SLASH_COMMANDS.filter(c => c.startsWith(value))
      setSuggestions(matches)
      setSugIdx(0)
    } else if (value.includes('@')) {
      const after = value.split('@').pop() ?? ''
      const matches = FILE_SUGGESTIONS.filter(f => f.includes(after))
      setSuggestions(matches.map(f => '@' + f))
      setSugIdx(0)
    } else {
      setSuggestions([])
    }
  }, [value])

  useInput((ch, key) => {
    if (key.return) {
      if (value.trim()) {
        setSubmitted(prev => [...prev, value])
        setHistory(prev => [value, ...prev])
        setValue('')
        setHistIdx(-1)
      }
      return
    }

    if (key.tab && suggestions.length > 0) {
      if (value.startsWith('/')) {
        setValue(suggestions[sugIdx]! + ' ')
      } else {
        const base = value.slice(0, value.lastIndexOf('@'))
        setValue(base + suggestions[sugIdx]! + ' ')
      }
      setSuggestions([])
      return
    }

    if (key.upArrow && history.length > 0) {
      const idx = Math.min(history.length - 1, histIdx + 1)
      setHistIdx(idx)
      setValue(history[idx]!)
      return
    }
    if (key.downArrow) {
      if (histIdx > 0) {
        setHistIdx(histIdx - 1)
        setValue(history[histIdx - 1]!)
      } else {
        setHistIdx(-1)
        setValue('')
      }
      return
    }

    if (key.backspace || key.delete) {
      setValue(v => v.slice(0, -1))
      return
    }

    if (ch && !key.ctrl && !key.meta) {
      setValue(v => v + ch)
      setHistIdx(-1)
    }
  })

  return (
    <Box flexDirection="column" padding={1}>
      {/* Submitted messages */}
      {submitted.map((msg, i) => (
        <Box key={i} gap={1} marginBottom={0}>
          <Text color={colors.warning} bold>You</Text>
          <Text>{msg}</Text>
        </Box>
      ))}

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <Box flexDirection="column" marginBottom={0}>
          {suggestions.map((s, i) => (
            <Box key={s} gap={1}>
              <Text color={i === sugIdx ? colors.primary : undefined}>
                {i === sugIdx ? '\u25B8' : ' '}
              </Text>
              <Text bold={i === sugIdx} dimColor={i !== sugIdx}>{s}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Input line */}
      <Box gap={1}>
        <Text color={colors.primary}>{'\u276F'}</Text>
        <Text>{value}</Text>
        <Text color={colors.primary}>{'\u2588'}</Text>
      </Box>

      {suggestions.length > 0 && (
        <Text dimColor>tab complete</Text>
      )}

      <Help keys={[
        { key: 'enter', label: 'send' },
        { key: '/', label: 'commands' },
        { key: '@', label: 'mention file' },
        { key: '\u2191', label: 'history' },
      ]} />
    </Box>
  )
}
