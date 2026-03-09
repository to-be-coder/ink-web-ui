import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Badge, Sparkline, blendHex } from './utils'

/* ── Types ── */

interface Segment {
  label: string
  tokens: number
  color: string
}

/* ── Main ── */

export function ModernContextWindow() {
  const colors = useTheme()
  const maxTokens = 200000
  const warningThreshold = 0.8

  const [segments, setSegments] = useState<Segment[]>([
    { label: 'System', tokens: 4200, color: colors.secondary },
    { label: 'Conversation', tokens: 12800, color: colors.primary },
    { label: 'Tool Results', tokens: 8400, color: colors.info },
  ])
  const [history, setHistory] = useState<number[]>([12, 15, 18, 22, 25])
  const [view, setView] = useState<'bar' | 'breakdown'>('bar')
  const [runId, setRunId] = useState(0)

  // Simulate context growing
  useEffect(() => {
    const steps = [
      { conv: 18200, tools: 12600 },
      { conv: 28500, tools: 22100 },
      { conv: 42000, tools: 35800 },
      { conv: 58000, tools: 48200 },
      { conv: 72000, tools: 58400 },
      { conv: 88000, tools: 62000 },
      { conv: 105000, tools: 68000 },
    ]

    const timers = steps.map((step, i) =>
      setTimeout(() => {
        setSegments(prev => prev.map(s => {
          if (s.label === 'Conversation') return { ...s, tokens: step.conv }
          if (s.label === 'Tool Results') return { ...s, tokens: step.tools }
          return s
        }))
        const total = 4200 + step.conv + step.tools
        setHistory(prev => [...prev, Math.round((total / maxTokens) * 100)])
      }, (i + 1) * 2000)
    )

    return () => timers.forEach(clearTimeout)
  }, [runId])

  useEffect(() => {
    setSegments([
      { label: 'System', tokens: 4200, color: colors.secondary },
      { label: 'Conversation', tokens: 12800, color: colors.primary },
      { label: 'Tool Results', tokens: 8400, color: colors.info },
    ])
    setHistory([12, 15, 18, 22, 25])
  }, [runId])

  useInput((ch) => {
    if (ch === '\t' || ch === 'v') setView(v => v === 'bar' ? 'breakdown' : 'bar')
    if (ch === 'r') setRunId(n => n + 1)
  })

  const totalTokens = segments.reduce((s, seg) => s + seg.tokens, 0)
  const pct = totalTokens / maxTokens
  const available = maxTokens - totalTokens
  const isWarning = pct >= warningThreshold
  const barWidth = 50

  // Color transitions: green -> yellow -> red
  const barColor = pct < 0.5
    ? blendHex(colors.success, colors.warning, pct * 2)
    : blendHex(colors.warning, colors.error, (pct - 0.5) * 2)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Box gap={1}>
            <Text bold color={colors.primary}>Context Window</Text>
            {isWarning && <Badge label="WARNING" color={colors.error} />}
          </Box>
          <Box gap={1}>
            <Text color={barColor} bold>{Math.round(pct * 100)}%</Text>
            <Text dimColor>{formatTokens(totalTokens)} / {formatTokens(maxTokens)}</Text>
          </Box>
        </Box>

        {/* Main bar */}
        <Box marginBottom={1}>
          <SegmentedBar segments={segments} maxTokens={maxTokens} width={barWidth} />
        </Box>

        {/* Warning threshold line */}
        <Box marginBottom={1}>
          <Text dimColor>
            {'\u2500'.repeat(Math.round(warningThreshold * barWidth))}
          </Text>
          <Text color={colors.warning}>{'\u2502'} {Math.round(warningThreshold * 100)}%</Text>
        </Box>

        {view === 'bar' ? (
          <>
            {/* Legend */}
            <Box flexDirection="column" gap={0}>
              {segments.map(seg => (
                <Box key={seg.label} gap={1}>
                  <Text color={seg.color}>{'\u25A0'}</Text>
                  <Text>{seg.label}</Text>
                  <Text dimColor>{formatTokens(seg.tokens)} ({Math.round((seg.tokens / maxTokens) * 100)}%)</Text>
                </Box>
              ))}
              <Box gap={1}>
                <Text dimColor>{'\u25A1'}</Text>
                <Text dimColor>Available</Text>
                <Text dimColor>{formatTokens(available)} ({Math.round((available / maxTokens) * 100)}%)</Text>
              </Box>
            </Box>
          </>
        ) : (
          <>
            {/* Breakdown view */}
            <Box flexDirection="column" gap={0}>
              {segments.map(seg => {
                const segPct = seg.tokens / maxTokens
                const filled = Math.round(segPct * barWidth)
                return (
                  <Box key={seg.label} gap={1}>
                    <Text color={seg.color}>{'\u2588'.repeat(Math.max(1, filled))}</Text>
                    <Text bold color={seg.color}>{seg.label}</Text>
                    <Text dimColor>{formatTokens(seg.tokens)}</Text>
                  </Box>
                )
              })}
            </Box>
          </>
        )}

        {/* Sparkline */}
        <Box marginTop={1} gap={1}>
          <Text dimColor>Usage:</Text>
          <Sparkline values={history} color={barColor} />
          <Text dimColor>{history[history.length - 1]}%</Text>
        </Box>

        <HelpFooter keys={[
          { key: 'v', label: view === 'bar' ? 'breakdown' : 'overview' },
          { key: 'r', label: 'restart' },
        ]} />
      </Card>
    </Box>
  )
}

/* ── Segmented Bar ── */

function SegmentedBar({ segments, maxTokens, width }: { segments: Segment[]; maxTokens: number; width: number }) {
  const total = segments.reduce((s, seg) => s + seg.tokens, 0)
  const available = maxTokens - total

  return (
    <Box>
      {segments.map(seg => {
        const w = Math.max(1, Math.round((seg.tokens / maxTokens) * width))
        return <Text key={seg.label} color={seg.color}>{'\u2588'.repeat(w)}</Text>
      })}
      <Text dimColor>{'\u2591'.repeat(Math.max(0, Math.round((available / maxTokens) * width)))}</Text>
    </Box>
  )
}

/* ── Helpers ── */

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
