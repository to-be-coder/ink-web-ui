import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge } from './utils'

interface Model {
  id: string
  name: string
  desc: string
  speed: string
  cost: string
}

const MODELS: Model[] = [
  { id: 'opus', name: 'Claude Opus 4.6', desc: 'Most capable, deep reasoning', speed: '\u2022\u2022\u25CB', cost: '$$$' },
  { id: 'sonnet', name: 'Claude Sonnet 4.6', desc: 'Fast and intelligent', speed: '\u2022\u2022\u2022', cost: '$$' },
  { id: 'haiku', name: 'Claude Haiku 4.5', desc: 'Fastest, lightweight tasks', speed: '\u2022\u2022\u2022', cost: '$' },
]

export function AIModelSelector() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  useInput((ch, key) => {
    if (selected) {
      if (ch === 'c') setSelected(null)
      return
    }
    if (key.upArrow) setCursor(c => Math.max(0, c - 1))
    if (key.downArrow) setCursor(c => Math.min(MODELS.length - 1, c + 1))
    if (key.return) setSelected(MODELS[cursor]!.id)
  })

  if (selected) {
    const model = MODELS.find(m => m.id === selected)!
    return (
      <Box flexDirection="column" padding={1}>
        <Box gap={1}>
          <Text color={colors.success}>{'\u2713'}</Text>
          <Text>Model</Text>
          <Badge label={model.name} color={colors.primary} />
        </Box>
        <Help keys={[{ key: 'c', label: 'change' }]} />
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}><Text bold>Select model</Text></Box>

      {MODELS.map((model, i) => {
        const isCursor = i === cursor
        return (
          <Box key={model.id} gap={1}>
            <Text color={isCursor ? colors.primary : undefined}>
              {isCursor ? '\u25B8' : ' '}
            </Text>
            <Box flexDirection="column">
              <Box gap={1}>
                <Text bold={isCursor} color={isCursor ? colors.primary : undefined}>
                  {model.name}
                </Text>
                <Text dimColor>{model.cost}</Text>
              </Box>
              <Text dimColor>{model.desc} {'\u2500'} Speed {model.speed}</Text>
            </Box>
          </Box>
        )
      })}

      <Help keys={[
        { key: '\u2191\u2193', label: 'move' },
        { key: 'enter', label: 'select' },
      ]} />
    </Box>
  )
}
