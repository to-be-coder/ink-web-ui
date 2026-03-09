import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, SPIN, blendHex } from './utils'

interface ReasoningStep {
  label: string
  detail: string
}

const STEPS: ReasoningStep[] = [
  { label: 'Understanding the request', detail: 'User wants JWT auth added to Express routes' },
  { label: 'Analyzing dependencies', detail: 'Express 4.x, no existing auth library found' },
  { label: 'Evaluating approaches', detail: 'Passport.js vs custom middleware \u2500 choosing custom for simplicity' },
  { label: 'Planning file changes', detail: 'Create auth.ts, modify routes.ts, update app.ts, extend types.ts' },
  { label: 'Considering edge cases', detail: 'Token expiry, missing headers, malformed tokens' },
  { label: 'Determining test strategy', detail: 'Unit tests for auth functions, integration tests for routes' },
]

export function AIReasoning() {
  const colors = useTheme()
  const [visible, setVisible] = useState<number>(0)
  const [thinking, setThinking] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [frame, setFrame] = useState(0)
  const [expanded, setExpanded] = useState(true)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!thinking) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [thinking])

  useEffect(() => {
    setVisible(0)
    setThinking(true)
    setElapsed(0)

    const timers: ReturnType<typeof setTimeout>[] = []
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisible(i + 1), (i + 1) * 1200))
    })
    timers.push(setTimeout(() => setThinking(false), STEPS.length * 1200 + 500))
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => {
    if (ch === 'd') setExpanded(e => !e)
    if (ch === 'r') setRunId(n => n + 1)
  })

  const shimmer = thinking
    ? blendHex(colors.primary, colors.secondary, Math.sin(frame * 0.08) * 0.5 + 0.5)
    : 'gray'

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={1} marginBottom={expanded ? 1 : 0}>
        {thinking ? (
          <Text color={shimmer}>{SPIN[frame % SPIN.length]}</Text>
        ) : (
          <Text dimColor>{expanded ? '\u25BC' : '\u25B6'}</Text>
        )}
        <Text color={thinking ? shimmer : undefined} dimColor={!thinking} bold={thinking}>
          {thinking ? `Reasoning (${elapsed}s)` : `Reasoned for ${elapsed}s`}
        </Text>
      </Box>

      {expanded && (
        <Box flexDirection="column">
          {STEPS.slice(0, visible).map((step, i) => {
            const isLatest = i === visible - 1 && thinking
            return (
              <Box key={i} gap={1}>
                <Text color={isLatest ? shimmer : colors.success} dimColor={!isLatest}>
                  {isLatest ? '\u25CF' : '\u25CB'}
                </Text>
                <Text bold={isLatest} dimColor={!isLatest}>{step.label}</Text>
                <Text dimColor>{'\u2500 ' + step.detail}</Text>
              </Box>
            )
          })}
        </Box>
      )}

      <Help keys={[
        { key: 'd', label: expanded ? 'collapse' : 'expand' },
        { key: 'r', label: 'restart' },
      ]} />
    </Box>
  )
}
