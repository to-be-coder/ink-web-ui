import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { G, Help } from './utils'

const OPTIONS = ['React', 'Vue', 'Svelte', 'Angular', 'Solid', 'Astro']

export function CleanSelect() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  useInput((ch, key) => {
    if (selected) return
    if (key.upArrow) setCursor(c => Math.max(0, c - 1))
    if (key.downArrow) setCursor(c => Math.min(OPTIONS.length - 1, c + 1))
    if (key.return) setSelected(OPTIONS[cursor]!)
  })

  if (selected) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box gap={1}>
          <G s="done" color={colors.success} />
          <Text>Framework</Text>
          <Text dimColor>{selected}</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={1} marginBottom={0}>
        <G s="active" />
        <Text bold>Choose a framework</Text>
      </Box>

      {OPTIONS.map((opt, i) => (
        <Box key={opt} gap={1}>
          <G s="bar" />
          <Text color={i === cursor ? colors.primary : undefined}>
            {i === cursor ? '\u25B8' : ' '}
          </Text>
          <Text bold={i === cursor}>{opt}</Text>
        </Box>
      ))}

      <Help keys={[{ key: '\u2191\u2193', label: 'move' }, { key: 'enter', label: 'select' }]} />
    </Box>
  )
}
