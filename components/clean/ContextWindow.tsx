import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

interface Segment { label: string; tokens: number; color: string }

export function CleanContextWindow() {
  const colors = useTheme()
  const max = 200000

  const [segments, setSegments] = useState<Segment[]>([
    { label: 'System', tokens: 4200, color: colors.secondary },
    { label: 'Conversation', tokens: 12800, color: colors.primary },
    { label: 'Tools', tokens: 8400, color: colors.info },
  ])
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    setSegments([
      { label: 'System', tokens: 4200, color: colors.secondary },
      { label: 'Conversation', tokens: 12800, color: colors.primary },
      { label: 'Tools', tokens: 8400, color: colors.info },
    ])
    const steps = [
      { conv: 28000, tools: 18000 },
      { conv: 52000, tools: 35000 },
      { conv: 78000, tools: 48000 },
      { conv: 105000, tools: 58000 },
      { conv: 130000, tools: 42000 },
    ]
    const timers = steps.map((s, i) =>
      setTimeout(() => setSegments(prev => prev.map(seg =>
        seg.label === 'Conversation' ? { ...seg, tokens: s.conv } :
        seg.label === 'Tools' ? { ...seg, tokens: s.tools } : seg
      )), (i + 1) * 2500)
    )
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  const total = segments.reduce((s, seg) => s + seg.tokens, 0)
  const pct = Math.round((total / max) * 100)
  const w = 40

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold>Context</Text>
        <Text dimColor={pct < 80} color={pct >= 80 ? colors.error : undefined} bold={pct >= 80}>
          {pct}% {'\u2500'} {fmt(total)} / {fmt(max)}
        </Text>
      </Box>

      {/* Bar */}
      <Box>
        {segments.map(seg => {
          const segW = Math.max(1, Math.round((seg.tokens / max) * w))
          return <Text key={seg.label} color={seg.color}>{'\u2588'.repeat(segW)}</Text>
        })}
        <Text dimColor>{'\u2591'.repeat(Math.max(0, w - Math.round((total / max) * w)))}</Text>
      </Box>

      {/* Legend */}
      <Box flexDirection="column" marginTop={1}>
        {segments.map(seg => (
          <Box key={seg.label} gap={1}>
            <Text color={seg.color}>{'\u25A0'}</Text>
            <Text>{seg.label}</Text>
            <Text dimColor>{fmt(seg.tokens)} ({Math.round((seg.tokens / max) * 100)}%)</Text>
          </Box>
        ))}
        <Box gap={1}>
          <Text dimColor>{'\u25A1'}</Text>
          <Text dimColor>Available</Text>
          <Text dimColor>{fmt(max - total)} ({Math.round(((max - total) / max) * 100)}%)</Text>
        </Box>
      </Box>

      <Help keys={[{ key: 'r', label: 'restart' }]} />
    </Box>
  )
}
