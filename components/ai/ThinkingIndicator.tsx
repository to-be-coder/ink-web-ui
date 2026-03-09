import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, SPIN, blendHex } from './utils'

const THINKING_STEPS = [
  'Analyzing the codebase structure...',
  'Identifying files that need auth middleware...',
  'Checking existing route patterns...',
  'Planning the implementation approach...',
  'Determining test coverage requirements...',
]

export function AIThinkingIndicator() {
  const colors = useTheme()
  const [expanded, setExpanded] = useState(true)
  const [steps, setSteps] = useState<string[]>([])
  const [thinking, setThinking] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [frame, setFrame] = useState(0)
  const [runId, setRunId] = useState(0)
  const [shimmerFrame, setShimmerFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => { setFrame(f => f + 1); setShimmerFrame(f => f + 1) }, 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!thinking) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [thinking])

  useEffect(() => {
    setSteps([])
    setThinking(true)
    setElapsed(0)

    const timers: ReturnType<typeof setTimeout>[] = []
    THINKING_STEPS.forEach((step, i) => {
      timers.push(setTimeout(() => setSteps(prev => [...prev, step]), (i + 1) * 1500))
    })
    timers.push(setTimeout(() => setThinking(false), THINKING_STEPS.length * 1500 + 500))
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => {
    if (ch === 'd') setExpanded(e => !e)
    if (ch === 'r') setRunId(n => n + 1)
  })

  // Shimmer color for the header
  const shimmer = thinking
    ? blendHex(colors.primary, colors.secondary, Math.sin(shimmerFrame * 0.08) * 0.5 + 0.5)
    : 'gray'

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box gap={1}>
        {thinking ? (
          <Text color={shimmer}>{SPIN[frame % SPIN.length]}</Text>
        ) : (
          <Text dimColor>{'\u25BC'}</Text>
        )}
        <Text color={thinking ? shimmer : undefined} dimColor={!thinking} bold={thinking}>
          {thinking ? 'Thinking' : `Thought for ${elapsed}s`}
        </Text>
        {thinking && <Text dimColor>{elapsed}s</Text>}
      </Box>

      {/* Steps */}
      {expanded && (
        <Box flexDirection="column" marginLeft={2} marginTop={0}>
          {steps.map((step, i) => (
            <Box key={i} gap={1}>
              <Text dimColor>{'\u2502'}</Text>
              <Text dimColor>{step}</Text>
            </Box>
          ))}
          {thinking && steps.length > 0 && (
            <Box gap={1}>
              <Text dimColor>{'\u2502'}</Text>
              <Text color={shimmer}>{'\u2026'}</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Collapsed state */}
      {!expanded && !thinking && (
        <Box marginLeft={2}><Text dimColor>{steps.length} reasoning steps</Text></Box>
      )}

      <Help keys={[
        { key: 'd', label: expanded ? 'collapse' : 'expand' },
        { key: 'r', label: 'restart' },
      ]} />
    </Box>
  )
}
