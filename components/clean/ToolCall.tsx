import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, SPIN } from './utils'

interface Call {
  id: string
  tool: string
  target: string
  result: string
  error?: boolean
}

const CALLS: Call[] = [
  { id: '1', tool: 'Read', target: 'src/index.ts', result: '42 lines' },
  { id: '2', tool: 'Search', target: '"auth" in src/', result: '2 matches in 2 files' },
  { id: '3', tool: 'Edit', target: 'src/routes.ts', result: '3 lines changed' },
  { id: '4', tool: 'Write', target: 'src/auth.ts', result: '38 lines written' },
  { id: '5', tool: 'Bash', target: 'npm test', result: '17 passed, 1 failed', error: true },
  { id: '6', tool: 'Edit', target: 'src/routes.test.ts', result: 'All 18 tests passing' },
]

type Status = 'pending' | 'running' | 'done' | 'error'

export function CleanToolCall() {
  const colors = useTheme()
  const [items, setItems] = useState<(Call & { status: Status })[]>([])
  const [frame, setFrame] = useState(0)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setItems([])
    const timers: ReturnType<typeof setTimeout>[] = []
    CALLS.forEach((call, i) => {
      timers.push(setTimeout(() => {
        setItems(prev => {
          const done = prev.map(c => c.status === 'running'
            ? { ...c, status: (c.error ? 'error' : 'done') as Status } : c)
          return [...done, { ...call, status: 'running' as Status }]
        })
      }, i * 1800))
    })
    timers.push(setTimeout(() => {
      setItems(prev => prev.map(c => c.status === 'running'
        ? { ...c, status: (c.error ? 'error' : 'done') as Status } : c))
    }, CALLS.length * 1800))
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  return (
    <Box flexDirection="column" padding={1}>
      {items.map(call => (
        <Box key={call.id} gap={1}>
          {call.status === 'running' && <Text color={colors.primary}>{SPIN[frame % SPIN.length]}</Text>}
          {call.status === 'done' && <Text color={colors.success}>{'\u2713'}</Text>}
          {call.status === 'error' && <Text color={colors.error}>{'\u2717'}</Text>}
          <Text bold={call.status === 'running'}>{call.tool}</Text>
          <Text dimColor>{call.target}</Text>
          {call.status !== 'running' && (
            <Text dimColor={call.status === 'done'} color={call.status === 'error' ? colors.error : undefined}>
              {'\u2500 ' + call.result}
            </Text>
          )}
        </Box>
      ))}
      {items.length === 0 && <Text dimColor>Waiting...</Text>}
      <Help keys={[{ key: 'r', label: 'restart' }]} />
    </Box>
  )
}
