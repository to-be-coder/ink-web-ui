import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep } from './utils'

interface Suggestion {
  text: string
  category: 'follow-up' | 'explore' | 'action' | 'refine'
  icon: string
}

const SUGGESTION_SETS: Suggestion[][] = [
  [
    { text: 'Add unit tests for the auth module', category: 'action', icon: '⚡' },
    { text: 'How does the token refresh work?', category: 'follow-up', icon: '?' },
    { text: 'Show me the error handling flow', category: 'explore', icon: '◈' },
    { text: 'Make it work with OAuth2 instead', category: 'refine', icon: '↻' },
    { text: 'Add rate limiting to the endpoints', category: 'action', icon: '⚡' },
    { text: 'Explain the middleware chain', category: 'explore', icon: '◈' },
  ],
  [
    { text: 'Deploy this to Vercel', category: 'action', icon: '⚡' },
    { text: 'What are the security implications?', category: 'follow-up', icon: '?' },
    { text: 'Compare JWT vs session tokens', category: 'explore', icon: '◈' },
    { text: 'Add input validation with Zod', category: 'refine', icon: '↻' },
    { text: 'Generate API documentation', category: 'action', icon: '⚡' },
  ],
]

const CATEGORY_COLORS: Record<string, (c: ReturnType<typeof useTheme>) => string> = {
  'follow-up': c => c.info,
  'explore': c => c.secondary,
  'action': c => c.success,
  'refine': c => c.warning,
}

export function NewAISuggestionChips() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [setIdx, setSetIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(0)

  const suggestions = SUGGESTION_SETS[setIdx]!

  useEffect(() => {
    setFadeIn(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i <= suggestions.length; i++) {
      timers.push(setTimeout(() => setFadeIn(i), i * 120))
    }
    return () => timers.forEach(clearTimeout)
  }, [setIdx])

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(suggestions.length - 1, c + 1))
    if (key.return) {
      setSelected(suggestions[cursor]!.text)
      setTimeout(() => setSelected(null), 2000)
    }
    if (ch === 'n') { setSetIdx(i => (i + 1) % SUGGESTION_SETS.length); setCursor(0) }
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={2} marginBottom={1}>
        <Badge label="Suggestions" color={colors.primary} />
        <Text dimColor>Set {setIdx + 1}/{SUGGESTION_SETS.length}</Text>
      </Box>

      {/* Category legend */}
      <Box gap={3} marginBottom={1}>
        {(['follow-up', 'explore', 'action', 'refine'] as const).map(cat => (
          <Box key={cat} gap={1}>
            <Text color={CATEGORY_COLORS[cat]!(colors)}>●</Text>
            <Text dimColor>{cat}</Text>
          </Box>
        ))}
      </Box>

      <Sep />

      {/* Suggestions list */}
      <Box flexDirection="column" marginTop={1}>
        {suggestions.map((sug, i) => {
          const visible = i < fadeIn
          const isCursor = i === cursor
          const catColor = CATEGORY_COLORS[sug.category]!(colors)

          if (!visible) return <Box key={i}><Text dimColor>  ·</Text></Box>

          return (
            <Box key={i} gap={1} marginBottom={0}>
              <Text color={isCursor ? colors.primary : undefined}>
                {isCursor ? '▸' : ' '}
              </Text>
              <Text color={catColor}>{sug.icon}</Text>
              <Box
                borderStyle={isCursor ? 'round' : undefined}
                borderColor={isCursor ? catColor : undefined}
                paddingLeft={isCursor ? 1 : 0}
                paddingRight={isCursor ? 1 : 0}
              >
                <Text bold={isCursor} color={isCursor ? catColor : undefined}>
                  {sug.text}
                </Text>
              </Box>
            </Box>
          )
        })}
      </Box>

      {/* Selected confirmation */}
      {selected && (
        <Box marginTop={1} gap={1}>
          <Text color={colors.success}>✓</Text>
          <Text color={colors.success} bold>Sending:</Text>
          <Text>{selected}</Text>
        </Box>
      )}

      <Help keys={[
        { key: 'j/k', label: 'navigate' },
        { key: '⏎', label: 'select' },
        { key: 'n', label: 'next set' },
      ]} />
    </Box>
  )
}
