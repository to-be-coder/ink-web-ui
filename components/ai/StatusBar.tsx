import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { SPIN, Badge, Sep, blendHex } from './utils'

export function AIStatusBar() {
  const colors = useTheme()
  const [model] = useState('opus-4-6')
  const [tokens, setTokens] = useState(0)
  const [cost, setCost] = useState(0)
  const [streaming, setStreaming] = useState(false)
  const [frame, setFrame] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setTokens(0)
    setCost(0)
    setStreaming(false)
    setElapsed(0)

    const timers: ReturnType<typeof setTimeout>[] = []

    // Simulate streaming bursts
    const bursts = [
      { delay: 500, tokens: 2400, cost: 0.012, streaming: true },
      { delay: 3000, tokens: 8200, cost: 0.065, streaming: true },
      { delay: 6000, tokens: 14800, cost: 0.112, streaming: false },
      { delay: 8000, tokens: 18200, cost: 0.142, streaming: true },
      { delay: 11000, tokens: 24600, cost: 0.198, streaming: false },
    ]

    bursts.forEach(b => {
      timers.push(setTimeout(() => {
        setTokens(b.tokens)
        setCost(b.cost)
        setStreaming(b.streaming)
      }, b.delay))
    })

    return () => timers.forEach(clearTimeout)
  }, [runId])

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  const shimmer = streaming
    ? blendHex(colors.primary, colors.secondary, Math.sin(frame * 0.1) * 0.5 + 0.5)
    : undefined

  return (
    <Box flexDirection="column" padding={1}>
      {/* Top bar */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Badge label={model} color={colors.primary} />
          {streaming && (
            <Box gap={1}>
              <Text color={shimmer}>{SPIN[frame % SPIN.length]}</Text>
              <Text color={shimmer}>streaming</Text>
            </Box>
          )}
        </Box>
        <Box gap={1}>
          <Text dimColor>{elapsed}s</Text>
          <Text dimColor>{'\u2502'}</Text>
          <Text bold>{fmt(tokens)}</Text>
          <Text dimColor>tokens</Text>
          <Text dimColor>{'\u2502'}</Text>
          <Text color={cost > 0.15 ? colors.warning : colors.success} bold>
            ${cost.toFixed(3)}
          </Text>
        </Box>
      </Box>

      <Sep />

      {/* Activity indicator */}
      <Box marginTop={1} flexDirection="column">
        <Box gap={1}>
          <Text dimColor>Status</Text>
          {streaming ? (
            <Text color={colors.primary} bold>Generating response</Text>
          ) : tokens > 0 ? (
            <Text color={colors.success}>Ready</Text>
          ) : (
            <Text dimColor>Idle</Text>
          )}
        </Box>

        <Box gap={1}>
          <Text dimColor>Context</Text>
          <Box>
            <Text color={colors.primary}>{'\u2588'.repeat(Math.round((tokens / 200000) * 30))}</Text>
            <Text dimColor>{'\u2591'.repeat(30 - Math.round((tokens / 200000) * 30))}</Text>
          </Box>
          <Text dimColor>{Math.round((tokens / 200000) * 100)}%</Text>
        </Box>
      </Box>

      <Box marginTop={1}><Text dimColor>r restart</Text></Box>
    </Box>
  )
}
