import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep } from './utils'

interface Usage {
  inputTokens: number
  outputTokens: number
  cacheRead: number
  cacheWrite: number
  cost: number
}

const USAGE_STEPS: Usage[] = [
  { inputTokens: 2400, outputTokens: 0, cacheRead: 1800, cacheWrite: 600, cost: 0.012 },
  { inputTokens: 4800, outputTokens: 320, cacheRead: 3200, cacheWrite: 600, cost: 0.028 },
  { inputTokens: 8200, outputTokens: 1450, cacheRead: 5600, cacheWrite: 1200, cost: 0.065 },
  { inputTokens: 12600, outputTokens: 3200, cacheRead: 8400, cacheWrite: 1800, cost: 0.112 },
  { inputTokens: 18400, outputTokens: 5800, cacheRead: 12000, cacheWrite: 2400, cost: 0.185 },
  { inputTokens: 24200, outputTokens: 8600, cacheRead: 16800, cacheWrite: 3000, cost: 0.264 },
]

export function AICostTracker() {
  const colors = useTheme()
  const [usage, setUsage] = useState<Usage>(USAGE_STEPS[0]!)
  const [step, setStep] = useState(0)
  const [model] = useState('claude-opus-4-6')
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    setStep(0)
    setUsage(USAGE_STEPS[0]!)
    const timers = USAGE_STEPS.slice(1).map((u, i) =>
      setTimeout(() => { setUsage(u); setStep(i + 1) }, (i + 1) * 2000)
    )
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  const total = usage.inputTokens + usage.outputTokens

  return (
    <Box flexDirection="column" padding={1}>
      {/* Status bar */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Badge label={model} color={colors.primary} />
        </Box>
        <Box gap={1}>
          <Text color={colors.success} bold>${usage.cost.toFixed(3)}</Text>
          <Text dimColor>{'\u2502'}</Text>
          <Text dimColor>{fmt(total)} tokens</Text>
        </Box>
      </Box>

      <Sep />

      {/* Breakdown */}
      <Box flexDirection="column" marginTop={1}>
        <Box justifyContent="space-between">
          <Text>Input tokens</Text>
          <Text bold>{fmt(usage.inputTokens)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text>Output tokens</Text>
          <Text bold>{fmt(usage.outputTokens)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text dimColor>Cache read</Text>
          <Text dimColor>{fmt(usage.cacheRead)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text dimColor>Cache write</Text>
          <Text dimColor>{fmt(usage.cacheWrite)}</Text>
        </Box>
      </Box>

      <Sep />

      {/* Cost bar */}
      <Box marginTop={1} gap={1}>
        <Text dimColor>Cost</Text>
        <CostBar value={usage.cost} max={0.50} colors={colors} />
        <Text color={usage.cost > 0.20 ? colors.warning : colors.success} bold>
          ${usage.cost.toFixed(3)}
        </Text>
      </Box>

      <Help keys={[{ key: 'r', label: 'restart' }]} />
    </Box>
  )
}

function CostBar({ value, max, colors }: { value: number; max: number; colors: ReturnType<typeof useTheme> }) {
  const w = 20
  const pct = Math.min(1, value / max)
  const filled = Math.round(pct * w)
  const color = pct < 0.4 ? colors.success : pct < 0.7 ? colors.warning : colors.error
  return (
    <Box>
      <Text color={color}>{'\u2588'.repeat(filled)}</Text>
      <Text dimColor>{'\u2591'.repeat(w - filled)}</Text>
    </Box>
  )
}
