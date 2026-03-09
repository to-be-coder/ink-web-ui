import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { G, Help } from './utils'

const OPTIONS = ['TypeScript', 'ESLint', 'Prettier', 'Tailwind', 'Vitest', 'Docker']

export function CleanMultiSelect() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [checked, setChecked] = useState<Set<number>>(new Set([0, 2]))
  const [submitted, setSubmitted] = useState(false)

  useInput((ch, key) => {
    if (submitted) return
    if (key.upArrow) setCursor(c => Math.max(0, c - 1))
    if (key.downArrow) setCursor(c => Math.min(OPTIONS.length - 1, c + 1))
    if (ch === ' ') {
      setChecked(prev => {
        const next = new Set(prev)
        next.has(cursor) ? next.delete(cursor) : next.add(cursor)
        return next
      })
    }
    if (key.return) setSubmitted(true)
    if (ch === 'a') {
      setChecked(prev => prev.size === OPTIONS.length ? new Set() : new Set(OPTIONS.map((_, i) => i)))
    }
  })

  if (submitted) {
    const picked = OPTIONS.filter((_, i) => checked.has(i))
    return (
      <Box flexDirection="column" padding={1}>
        <Box gap={1}>
          <G s="done" color={colors.success} />
          <Text>Features</Text>
          <Text dimColor>{picked.join(', ')}</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={1}>
        <G s="active" />
        <Text bold>Select features</Text>
      </Box>

      {OPTIONS.map((opt, i) => (
        <Box key={opt} gap={1}>
          <G s="bar" />
          <Text color={i === cursor ? colors.primary : undefined}>
            {i === cursor ? '\u25B8' : ' '}
          </Text>
          <Text color={checked.has(i) ? colors.success : undefined}>
            {checked.has(i) ? '\u2713' : '\u25CB'}
          </Text>
          <Text bold={i === cursor}>{opt}</Text>
        </Box>
      ))}

      <Help keys={[
        { key: '\u2191\u2193', label: 'move' },
        { key: 'space', label: 'toggle' },
        { key: 'a', label: 'all' },
        { key: 'enter', label: 'confirm' },
      ]} />
    </Box>
  )
}
