import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, BRAILLE_FRAMES } from './utils'

/* ── Types ── */

type ToolStatus = 'running' | 'done' | 'error'

interface ToolCallData {
  id: string
  tool: string
  target: string
  status: ToolStatus
  result: string[]
}

/* ── Demo data ── */

const CALLS: Omit<ToolCallData, 'status'>[] = [
  {
    id: '1', tool: 'Read', target: 'src/index.ts',
    result: ['42 lines | Express app entry point'],
  },
  {
    id: '2', tool: 'Search', target: '"auth" in src/',
    result: ['2 matches in 2 files'],
  },
  {
    id: '3', tool: 'Edit', target: 'src/routes.ts',
    result: ['3 lines changed'],
  },
  {
    id: '4', tool: 'Write', target: 'src/auth.ts',
    result: ['38 lines written'],
  },
  {
    id: '5', tool: 'Bash', target: 'npm test',
    result: ['17 passed, 1 failed'],
  },
  {
    id: '6', tool: 'Edit', target: 'src/routes.test.ts',
    result: ['All 18 tests passing'],
  },
]

/* ── Main ── */

export function ModernToolCall() {
  const colors = useTheme()
  const [visible, setVisible] = useState<ToolCallData[]>([])
  const [frame, setFrame] = useState(0)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setVisible([])
    const timers: ReturnType<typeof setTimeout>[] = []

    CALLS.forEach((call, i) => {
      timers.push(setTimeout(() => {
        setVisible(prev => {
          const completed = prev.map(c => c.status === 'running' ? { ...c, status: 'done' as const } : c)
          const status: ToolStatus = call.id === '5' ? 'running' : 'running'
          return [...completed, { ...call, status }]
        })
      }, i * 2000))

      if (call.id === '5') {
        timers.push(setTimeout(() => {
          setVisible(prev => prev.map(c => c.id === '5' ? { ...c, status: 'error' as const } : c))
        }, i * 2000 + 1800))
      }
    })

    timers.push(setTimeout(() => {
      setVisible(prev => prev.map(c => c.status === 'running' ? { ...c, status: 'done' as const } : c))
    }, CALLS.length * 2000))

    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => {
    if (ch === 'r') setRunId(n => n + 1)
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>Tool Calls</Text>
        </Box>

        {visible.length === 0 && <Text dimColor>Waiting...</Text>}

        {visible.map((call) => (
          <Box key={call.id} gap={1}>
            {call.status === 'running' && (
              <Text color={colors.primary}>{BRAILLE_FRAMES[frame % BRAILLE_FRAMES.length]}</Text>
            )}
            {call.status === 'done' && <Text color={colors.success}>{'\u2714'}</Text>}
            {call.status === 'error' && <Text color={colors.error}>{'\u2718'}</Text>}
            <Text bold={call.status === 'running'} dimColor={call.status === 'done'}>{call.tool}</Text>
            <Text dimColor>{call.target}</Text>
            {call.status !== 'running' && (
              <Text dimColor={call.status === 'done'} color={call.status === 'error' ? colors.error : undefined}>
                {'\u2500 ' + call.result[call.result.length - 1]}
              </Text>
            )}
          </Box>
        ))}

        <HelpFooter keys={[{ key: 'r', label: 'restart' }]} />
      </Card>
    </Box>
  )
}
