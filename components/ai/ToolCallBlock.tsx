import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, SPIN } from './utils'

type Status = 'running' | 'done' | 'error'

interface ToolCall {
  id: string
  tool: string
  input: string
  output: string[]
  status: Status
}

const CALLS: Omit<ToolCall, 'status'>[] = [
  { id: '1', tool: 'Read', input: 'src/index.ts', output: ['42 lines', 'Express app with middleware chain'] },
  { id: '2', tool: 'Search', input: '"auth" in src/**', output: ['src/routes.ts:14 \u2500 // TODO: add auth', '2 matches in 2 files'] },
  { id: '3', tool: 'Edit', input: 'src/routes.ts', output: ['- // TODO: add auth', '+ import { requireAuth } from "./auth"', '+ router.use("/users", requireAuth)', '3 lines changed'] },
  { id: '4', tool: 'Write', input: 'src/auth.ts', output: ['Created new file (38 lines)', 'Exports: verifyToken, requireAuth, generateToken'] },
  { id: '5', tool: 'Bash', input: 'npm test', output: ['PASS auth.test.ts (6)', 'PASS app.test.ts (4)', 'PASS routes.test.ts (8)', 'All 18 tests passing'] },
]

const TOOL_COLORS: Record<string, (c: ReturnType<typeof useTheme>) => string> = {
  Read: c => c.info,
  Search: c => c.secondary,
  Edit: c => c.success,
  Write: c => c.primary,
  Bash: c => c.warning,
}

export function AIToolCallBlock() {
  const colors = useTheme()
  const [calls, setCalls] = useState<ToolCall[]>([])
  const [frame, setFrame] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setCalls([])
    setExpanded(new Set())
    const timers: ReturnType<typeof setTimeout>[] = []

    CALLS.forEach((call, i) => {
      timers.push(setTimeout(() => {
        setCalls(prev => {
          const done = prev.map(c => c.status === 'running' ? { ...c, status: 'done' as const } : c)
          return [...done, { ...call, status: 'running' as const }]
        })
        setExpanded(new Set([call.id]))
      }, i * 2200))
    })
    timers.push(setTimeout(() => {
      setCalls(prev => prev.map(c => c.status === 'running' ? { ...c, status: 'done' as const } : c))
    }, CALLS.length * 2200))
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => {
    if (ch === 'd') setExpanded(prev => prev.size > 0 ? new Set() : new Set(calls.map(c => c.id)))
    if (ch === 'r') setRunId(n => n + 1)
  })

  return (
    <Box flexDirection="column" padding={1}>
      {calls.map(call => {
        const tc = TOOL_COLORS[call.tool]?.(colors) ?? colors.primary
        const isExpanded = expanded.has(call.id)

        return (
          <Box key={call.id} flexDirection="column" marginBottom={0}>
            <Box gap={1}>
              {call.status === 'running' ? (
                <Text color={tc}>{SPIN[frame % SPIN.length]}</Text>
              ) : (
                <Text color={colors.success}>{'\u2713'}</Text>
              )}
              <Badge label={call.tool} color={tc} />
              <Text bold={call.status === 'running'} dimColor={call.status === 'done'}>
                {call.input}
              </Text>
            </Box>

            {isExpanded && (
              <Box flexDirection="column" marginLeft={2}>
                {call.output.map((line, li) => (
                  <Box key={li} gap={1}>
                    <Text color={tc} dimColor>{'\u2502'}</Text>
                    <Text dimColor={li < call.output.length - 1} color={li === call.output.length - 1 ? tc : undefined}>
                      {line}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )
      })}

      {calls.length === 0 && <Text dimColor>Waiting for tool calls...</Text>}

      <Help keys={[
        { key: 'd', label: expanded.size > 0 ? 'collapse' : 'expand' },
        { key: 'r', label: 'restart' },
      ]} />
    </Box>
  )
}
