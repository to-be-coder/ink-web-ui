import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { G, Help, SPIN } from './utils'

type Status = 'pending' | 'running' | 'done' | 'error'

interface Task {
  id: string
  label: string
  detail: string
  status: Status
  logs: string[]
}

const TASKS: Task[] = [
  { id: 'read', label: 'Reading codebase', detail: 'src/', status: 'running', logs: ['12 source files, 3 configs, 8 tests'] },
  { id: 'plan', label: 'Planning changes', detail: 'auth module', status: 'pending', logs: ['Modify 3 files, create 1 new file'] },
  { id: 'edit', label: 'Editing files', detail: '4 files', status: 'pending', logs: ['Created src/auth.ts', 'Updated src/routes.ts, src/app.ts, src/types.ts'] },
  { id: 'test', label: 'Running tests', detail: 'vitest', status: 'pending', logs: ['23 passed, 1 failed'] },
  { id: 'fix', label: 'Fixing test', detail: 'routes.test.ts', status: 'pending', logs: ['All 24 tests passing'] },
]

export function CleanTaskPipeline() {
  const colors = useTheme()
  const [tasks, setTasks] = useState<Task[]>(TASKS)
  const [frame, setFrame] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [runId, setRunId] = useState(0)

  const allDone = tasks.every(t => t.status === 'done' || t.status === 'error')

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (allDone) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [allDone])

  useEffect(() => {
    const order = ['read', 'plan', 'edit', 'test', 'fix']
    const timers = order.map((id, i) => {
      const next = order[i + 1]
      if (id === 'test') {
        return setTimeout(() => setTasks(t => t.map(tk =>
          tk.id === id ? { ...tk, status: 'error' as const, detail: '1 failure' } :
          next && tk.id === next ? { ...tk, status: 'running' as const } : tk
        )), (i + 1) * 2000)
      }
      return setTimeout(() => setTasks(t => t.map(tk =>
        tk.id === id ? { ...tk, status: 'done' as const } :
        next && tk.id === next ? { ...tk, status: 'running' as const } : tk
      )), (i + 1) * 2000)
    })
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => {
    if (ch === 'd') setExpanded(e => !e)
    if (ch === 'r') {
      setTasks(TASKS.map(t => ({ ...t, status: t.id === 'read' ? 'running' as const : 'pending' as const })))
      setElapsed(0)
      setRunId(n => n + 1)
    }
  })

  const done = tasks.filter(t => t.status === 'done').length
  const errs = tasks.filter(t => t.status === 'error').length

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold>Agent Task</Text>
        <Text dimColor>{elapsed}s {done + errs}/{tasks.length}</Text>
      </Box>

      {tasks.map((task, i) => {
        const glyph = task.status === 'running' ? 'active' : task.status === 'done' ? 'done' : task.status === 'error' ? 'error' : 'pending'
        const isLast = i === tasks.length - 1

        return (
          <Box key={task.id} flexDirection="column">
            <Box gap={1}>
              {task.status === 'running'
                ? <Text color={colors.primary}>{SPIN[frame % SPIN.length]}</Text>
                : <G s={glyph as any} />
              }
              <Text bold={task.status === 'running'} dimColor={task.status === 'pending'}>
                {task.label}
              </Text>
              <Text dimColor>{task.detail}</Text>
            </Box>

            {expanded && task.status !== 'pending' && (
              <Box flexDirection="column">
                {task.logs.map((log, li) => (
                  <Box key={li} gap={1}>
                    <G s="bar" />
                    <Text dimColor>{log}</Text>
                  </Box>
                ))}
              </Box>
            )}

            {!isLast && (
              <Box><G s="bar" /></Box>
            )}
          </Box>
        )
      })}

      {allDone && (
        <Box marginTop={1}>
          <Text dimColor>
            {errs > 0 ? `Done in ${elapsed}s with ${errs} error${errs > 1 ? 's' : ''}` : `Done in ${elapsed}s`}
          </Text>
        </Box>
      )}

      <Help keys={[
        { key: 'd', label: expanded ? 'collapse' : 'details' },
        { key: 'r', label: 'restart' },
      ]} />
    </Box>
  )
}
