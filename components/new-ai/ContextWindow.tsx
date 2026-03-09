import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep, blendHex } from './utils'

interface ContextSegment {
  label: string
  tokens: number
  type: 'system' | 'user' | 'assistant' | 'tool' | 'cache' | 'available'
}

const SCENARIOS: { name: string; maxTokens: number; segments: ContextSegment[] }[] = [
  {
    name: 'Fresh conversation',
    maxTokens: 200000,
    segments: [
      { label: 'System prompt', tokens: 4200, type: 'system' },
      { label: 'User messages', tokens: 1800, type: 'user' },
      { label: 'Assistant output', tokens: 3200, type: 'assistant' },
      { label: 'Available', tokens: 190800, type: 'available' },
    ],
  },
  {
    name: 'Mid-session',
    maxTokens: 200000,
    segments: [
      { label: 'System prompt', tokens: 4200, type: 'system' },
      { label: 'Cached context', tokens: 18000, type: 'cache' },
      { label: 'User messages', tokens: 12400, type: 'user' },
      { label: 'Tool results', tokens: 28600, type: 'tool' },
      { label: 'Assistant output', tokens: 34200, type: 'assistant' },
      { label: 'Available', tokens: 102600, type: 'available' },
    ],
  },
  {
    name: 'Near limit',
    maxTokens: 200000,
    segments: [
      { label: 'System prompt', tokens: 4200, type: 'system' },
      { label: 'Cached context', tokens: 42000, type: 'cache' },
      { label: 'User messages', tokens: 24800, type: 'user' },
      { label: 'Tool results', tokens: 56400, type: 'tool' },
      { label: 'Assistant output', tokens: 61200, type: 'assistant' },
      { label: 'Available', tokens: 11400, type: 'available' },
    ],
  },
]

const TYPE_COLORS: Record<string, (c: ReturnType<typeof useTheme>) => string> = {
  system: c => c.secondary,
  user: c => c.warning,
  assistant: c => c.info,
  tool: c => c.primary,
  cache: c => c.success,
  available: c => '#444444',
}

export function NewAIContextWindow() {
  const colors = useTheme()
  const [sceneIdx, setSceneIdx] = useState(0)
  const [cursor, setCursor] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [animProgress, setAnimProgress] = useState(0)

  const scene = SCENARIOS[sceneIdx]!
  const usedTokens = scene.segments.reduce((a, s) => a + (s.type !== 'available' ? s.tokens : 0), 0)
  const usagePct = Math.round((usedTokens / scene.maxTokens) * 100)

  useEffect(() => {
    if (!animate) { setAnimProgress(1); return }
    setAnimProgress(0)
    let frame = 0
    const id = setInterval(() => {
      frame++
      setAnimProgress(Math.min(1, frame / 30))
      if (frame >= 30) clearInterval(id)
    }, 30)
    return () => clearInterval(id)
  }, [sceneIdx, animate])

  useInput((ch, key) => {
    if (key.leftArrow || ch === 'h') { setSceneIdx(i => Math.max(0, i - 1)); setCursor(0) }
    if (key.rightArrow || ch === 'l') { setSceneIdx(i => Math.min(SCENARIOS.length - 1, i + 1)); setCursor(0) }
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(scene.segments.length - 1, c + 1))
    if (ch === 'a') setAnimate(a => !a)
  })

  const barWidth = 50
  const urgencyColor = usagePct > 90 ? colors.error : usagePct > 70 ? colors.warning : colors.success

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={2} marginBottom={1}>
        <Badge label="Context" color={colors.secondary} />
        <Text bold>{scene.name}</Text>
        <Text dimColor>·</Text>
        <Text bold color={urgencyColor}>{usagePct}%</Text>
        <Text dimColor>used</Text>
      </Box>

      {/* Scenario tabs */}
      <Box gap={2} marginBottom={1}>
        {SCENARIOS.map((s, i) => (
          <Text
            key={i}
            bold={i === sceneIdx}
            color={i === sceneIdx ? colors.primary : undefined}
            dimColor={i !== sceneIdx}
            underline={i === sceneIdx}
          >
            {s.name}
          </Text>
        ))}
      </Box>

      {/* Main usage bar */}
      <Box flexDirection="column">
        <Box>
          {scene.segments.map((seg, i) => {
            const width = Math.max(1, Math.round((seg.tokens / scene.maxTokens) * barWidth * animProgress))
            const segColor = TYPE_COLORS[seg.type]!(colors)
            return <Text key={i} color={segColor}>{'█'.repeat(width)}</Text>
          })}
        </Box>
        <Box justifyContent="space-between">
          <Text dimColor>0</Text>
          <Text dimColor>{(scene.maxTokens / 1000).toFixed(0)}k tokens</Text>
        </Box>
      </Box>

      <Sep />

      {/* Segment breakdown */}
      <Box flexDirection="column" marginTop={1}>
        {scene.segments.map((seg, i) => {
          const selected = i === cursor
          const segColor = TYPE_COLORS[seg.type]!(colors)
          const pct = ((seg.tokens / scene.maxTokens) * 100).toFixed(1)
          const segBarW = Math.max(1, Math.round((seg.tokens / scene.maxTokens) * 30 * animProgress))

          return (
            <Box key={i} gap={1}>
              <Text color={selected ? colors.primary : undefined}>
                {selected ? '▸' : ' '}
              </Text>
              <Text color={segColor}>●</Text>
              <Box width={16}>
                <Text bold={selected} dimColor={seg.type === 'available'}>
                  {seg.label}
                </Text>
              </Box>
              <Text color={segColor}>{'█'.repeat(segBarW)}</Text>
              <Box width={10}>
                <Text dimColor>
                  {seg.tokens >= 1000 ? `${(seg.tokens / 1000).toFixed(1)}k` : seg.tokens}
                </Text>
              </Box>
              <Text dimColor>{pct}%</Text>
            </Box>
          )
        })}
      </Box>

      <Sep />

      {/* Summary stats */}
      <Box gap={4} marginTop={0}>
        <Box flexDirection="column">
          <Text dimColor>Used</Text>
          <Text bold color={urgencyColor}>{(usedTokens / 1000).toFixed(1)}k</Text>
        </Box>
        <Box flexDirection="column">
          <Text dimColor>Available</Text>
          <Text bold>{((scene.maxTokens - usedTokens) / 1000).toFixed(1)}k</Text>
        </Box>
        <Box flexDirection="column">
          <Text dimColor>Max</Text>
          <Text bold>{(scene.maxTokens / 1000).toFixed(0)}k</Text>
        </Box>
        <Box flexDirection="column">
          <Text dimColor>Turns</Text>
          <Text bold>{scene.segments.filter(s => s.type === 'user').length + scene.segments.filter(s => s.type === 'assistant').length}</Text>
        </Box>
      </Box>

      <Help keys={[
        { key: '◁/▷', label: 'scenario' },
        { key: 'j/k', label: 'segment' },
        { key: 'a', label: 'animate' },
      ]} />
    </Box>
  )
}
