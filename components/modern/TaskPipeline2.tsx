import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from '../theme'
import { HelpFooter, Badge } from './utils'

/* ── Types ── */

type TaskStatus = 'pending' | 'running' | 'done' | 'error'

interface LogLine {
  text: string
  dim?: boolean
  highlight?: boolean
}

interface Task {
  id: string
  label: string
  status: TaskStatus
  detail?: string
  logs: LogLine[]
}

/* ── Spinner ── */

const DOTS = ['\u25CB', '\u25D4', '\u25D1', '\u25D5', '\u25CF']

function StatusIcon({ status, frame, colors }: { status: TaskStatus; frame: number; colors: ReturnType<typeof useTheme> }) {
  if (status === 'done') return <Text color={colors.success}>{'\u25CF'}</Text>
  if (status === 'error') return <Text color={colors.error}>{'\u25CF'}</Text>
  if (status === 'pending') return <Text dimColor>{'\u25CB'}</Text>
  return <Text color={colors.primary}>{DOTS[frame % DOTS.length]}</Text>
}

/* ── Demo data ── */

const INITIAL_TASKS: Task[] = [
  {
    id: 'read', label: 'Reading codebase', status: 'running', detail: 'src/',
    logs: [
      { text: 'Read src/index.ts, src/app.ts, src/routes.ts', dim: true },
      { text: 'Read src/middleware.ts, src/types.ts', dim: true },
      { text: 'Read package.json, tsconfig.json', dim: true },
      { text: '12 source files, 3 configs, 8 tests', highlight: true },
    ],
  },
  {
    id: 'plan', label: 'Planning changes', status: 'pending', detail: 'auth module',
    logs: [
      { text: 'Analyzing import graph...', dim: true },
      { text: 'routes.ts \u2192 app.ts \u2192 index.ts', dim: true },
      { text: 'Strategy: create auth.ts, guard routes', dim: true },
      { text: 'Modify 3 files, create 1 new file', highlight: true },
    ],
  },
  {
    id: 'edit', label: 'Editing files', status: 'pending', detail: '4 files',
    logs: [
      { text: 'Created src/auth.ts \u2500 verifyToken, requireAuth', dim: true },
      { text: 'Updated src/routes.ts \u2500 added auth middleware', dim: true },
      { text: 'Updated src/app.ts \u2500 registered auth routes', dim: true },
      { text: 'Updated src/types.ts \u2500 User, AuthPayload', highlight: true },
    ],
  },
  {
    id: 'test', label: 'Running tests', status: 'pending', detail: 'vitest',
    logs: [
      { text: 'PASS  src/auth.test.ts (6 tests)', dim: true },
      { text: 'PASS  src/app.test.ts (4 tests)', dim: true },
      { text: 'FAIL  src/routes.test.ts', dim: true },
      { text: '  \u2718 GET /users \u2500 test missing auth header', highlight: true },
    ],
  },
  {
    id: 'fix', label: 'Fixing test', status: 'pending', detail: 'routes.test.ts',
    logs: [
      { text: 'Updated test to omit auth header', dim: true },
      { text: 'Added assertion for 401 status', dim: true },
      { text: 'Re-running vitest...', dim: true },
      { text: 'All 24 tests passing', highlight: true },
    ],
  },
]

/* ── Main ── */

export function ModernTaskPipeline2() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [frame, setFrame] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [runId, setRunId] = useState(0)
  const pausedRef = useRef(false)
  const mountedRef = useRef(true)
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState(false)
  const allFinished = tasks.every(t => t.status === 'done' || t.status === 'error')

  useEffect(() => {
    mountedRef.current = true
    // Wait for terminal to be fully sized (xterm fires onReady at ~200ms)
    // then clear buffer to wipe any ghost content from pre-sized renders
    const id = setTimeout(() => {
      if (mountedRef.current) {
        stdout.write('\x1b[2J\x1b[H')
        setReady(true)
      }
    }, 300)
    return () => {
      mountedRef.current = false
      clearTimeout(id)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (!mountedRef.current || pausedRef.current) return
      setFrame(f => f + 1)
    }, 150)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (allFinished) return
    const id = setInterval(() => {
      if (!mountedRef.current || pausedRef.current) return
      setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [allFinished])

  useEffect(() => {
    const timers = [
      setTimeout(() => { if (mountedRef.current) setTasks(t => t.map(tk => tk.id === 'read' ? { ...tk, status: 'done' } : tk.id === 'plan' ? { ...tk, status: 'running' } : tk)) }, 2000),
      setTimeout(() => { if (mountedRef.current) setTasks(t => t.map(tk => tk.id === 'plan' ? { ...tk, status: 'done' } : tk.id === 'edit' ? { ...tk, status: 'running' } : tk)) }, 4000),
      setTimeout(() => { if (mountedRef.current) setTasks(t => t.map(tk => tk.id === 'edit' ? { ...tk, status: 'done' } : tk.id === 'test' ? { ...tk, status: 'running' } : tk)) }, 6000),
      setTimeout(() => { if (mountedRef.current) setTasks(t => t.map(tk => tk.id === 'test' ? { ...tk, status: 'error', detail: '1 failure' } : tk.id === 'fix' ? { ...tk, status: 'running' } : tk)) }, 8000),
      setTimeout(() => { if (mountedRef.current) setTasks(t => t.map(tk => tk.id === 'fix' ? { ...tk, status: 'done' } : tk)) }, 10000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => {
    if (ch === ' ') {
      pausedRef.current = !pausedRef.current
      setPaused(p => !p)
    }
    if (ch === 'r') {
      setTasks(INITIAL_TASKS.map(tk => ({ ...tk, status: tk.id === 'read' ? 'running' as const : 'pending' as const })))
      setElapsed(0)
      setExpanded(false)
      setRunId(n => n + 1)
    }
    if (ch === 'd') setExpanded(e => !e)
  })

  if (!ready) return <Box />

  const doneCount = tasks.filter(t => t.status === 'done').length
  const errCount = tasks.filter(t => t.status === 'error').length
  const allDone = allFinished
  const statusColor = errCount > 0 ? colors.error : allDone ? colors.success : colors.info

  return (
    <Box flexDirection="column" paddingX={1}>
        <Box justifyContent="space-between" marginBottom={1}>
          <Box gap={1}>
            <Text bold color={colors.primary}>Agent Task</Text>
            {paused && <Badge label="PAUSED" color={colors.warning} />}
          </Box>
          <Box gap={1}>
            <Text dimColor>{elapsed}s</Text>
            <Text color={statusColor} bold>{doneCount}/{tasks.length}</Text>
          </Box>
        </Box>

        {tasks.map((task, i) => {
          const isLast = i === tasks.length - 1
          const hasRun = task.status !== 'pending'
          const lineColor = task.status === 'done' ? colors.success : task.status === 'error' ? colors.error : task.status === 'running' ? colors.primary : 'gray'

          return (
            <Box key={task.id} flexDirection="column">
              <Box gap={1}>
                <StatusIcon status={task.status} frame={frame} colors={colors} />
                <Text
                  bold={task.status === 'running'}
                  color={task.status === 'running' ? colors.primary : task.status === 'done' ? colors.success : task.status === 'error' ? colors.error : undefined}
                  dimColor={task.status === 'pending'}
                >
                  {task.label}
                </Text>
                <Text dimColor>{'\u2500 ' + task.detail}</Text>
              </Box>

              {expanded && hasRun && (
                <Box flexDirection="column">
                  {task.logs.map((log, li) => (
                    <Box key={li}>
                      <Text color={lineColor}>{'\u2502'} </Text>
                      <Text
                        dimColor={log.dim}
                        color={log.highlight ? lineColor : undefined}
                      >
                        {log.text}
                      </Text>
                    </Box>
                  ))}
                </Box>
              )}

              {!isLast && (
                <Box><Text color={lineColor}>{'\u2502'}</Text></Box>
              )}
            </Box>
          )
        })}

        {allDone && (
          <Box marginTop={1}>
            <Text color={statusColor} bold>
              {errCount > 0 ? `Done in ${elapsed}s with ${errCount} error${errCount > 1 ? 's' : ''}` : `Done in ${elapsed}s`}
            </Text>
          </Box>
        )}

        <HelpFooter keys={[
          { key: 'd', label: expanded ? 'collapse' : 'details' },
          { key: 'space', label: paused ? 'resume' : 'pause' },
          { key: 'r', label: 'restart' },
        ]} />
    </Box>
  )
}
