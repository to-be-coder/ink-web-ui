import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, BRAILLE_FRAMES, Badge, blendHex } from './utils'

/* ── Types ── */

type TaskStatus = 'pending' | 'running' | 'done' | 'error'

interface LogLine {
  text: string
  color?: string
  dim?: boolean
}

interface Task {
  id: string
  label: string
  status: TaskStatus
  detail?: string
  logs: LogLine[]
}

/* ── Status symbols ── */

function StatusIcon({ status, frame, color }: { status: TaskStatus; frame: number; color: string }) {
  const colors = useTheme()
  if (status === 'done') return <Text color={colors.success}>{'\u2714'}</Text>
  if (status === 'error') return <Text color={colors.error}>{'\u2718'}</Text>
  if (status === 'pending') return <Text dimColor>{'\u25CB'}</Text>
  return <Text color={color}>{BRAILLE_FRAMES[frame % BRAILLE_FRAMES.length]}</Text>
}

/* ── Demo data ── */

const INITIAL_TASKS: Task[] = [
  {
    id: 'read', label: 'Reading codebase', status: 'running', detail: 'src/',
    logs: [
      { text: 'Scanning project structure...', dim: true },
      { text: 'Read src/index.ts (42 lines)', dim: true },
      { text: 'Read src/app.ts (38 lines)', dim: true },
      { text: 'Read src/routes.ts (67 lines)', dim: true },
      { text: 'Read src/middleware.ts (23 lines)', dim: true },
      { text: 'Read src/types.ts (15 lines)', dim: true },
      { text: 'Read package.json, tsconfig.json', dim: true },
      { text: 'Found 12 source files, 3 config files, 8 test files', color: '' },
    ],
  },
  {
    id: 'plan', label: 'Planning changes', status: 'pending', detail: 'auth module',
    logs: [
      { text: 'Analyzing import graph...', dim: true },
      { text: 'routes.ts \u2192 app.ts \u2192 index.ts', dim: true },
      { text: 'middleware.ts has no existing auth logic', dim: true },
      { text: 'Strategy: create auth.ts, add middleware to routes', dim: true },
      { text: 'Modify 3 files, create 1 new file', color: '' },
    ],
  },
  {
    id: 'edit', label: 'Editing files', status: 'pending', detail: '4 files',
    logs: [
      { text: 'Created src/auth.ts', dim: true },
      { text: '  + verifyToken(): decode and validate JWT', dim: true },
      { text: '  + requireAuth(): Express middleware guard', dim: true },
      { text: '  + generateToken(): sign payload with secret', dim: true },
      { text: 'Updated src/routes.ts', dim: true },
      { text: '  + import { requireAuth } from "./auth"', dim: true },
      { text: '  + Added requireAuth to GET /users, POST /users', dim: true },
      { text: '  + Added POST /auth/login route', dim: true },
      { text: 'Updated src/app.ts \u2500 registered auth routes', dim: true },
      { text: 'Updated src/types.ts \u2500 added User, AuthPayload interfaces', color: '' },
    ],
  },
  {
    id: 'test', label: 'Running tests', status: 'pending', detail: 'vitest',
    logs: [
      { text: 'PASS  src/auth.test.ts (6 tests)', dim: true },
      { text: '  \u2714 verifyToken returns payload for valid JWT', dim: true },
      { text: '  \u2714 verifyToken throws for expired token', dim: true },
      { text: '  \u2714 requireAuth rejects missing header', dim: true },
      { text: 'PASS  src/app.test.ts (4 tests)', dim: true },
      { text: 'FAIL  src/routes.test.ts', color: '' },
      { text: '  \u2714 POST /auth/login returns token', dim: true },
      { text: '  \u2714 GET /health returns 200', dim: true },
      { text: '  \u2718 GET /users should require auth token', color: '' },
      { text: '    Expected: 401 Unauthorized', color: '' },
      { text: '    Received: 200 OK (test missing auth header)', color: '' },
      { text: '23 passed, 1 failed', color: '' },
    ],
  },
  {
    id: 'fix', label: 'Fixing test failure', status: 'pending', detail: 'routes.test.ts',
    logs: [
      { text: 'Root cause: test sends request without Authorization header', dim: true },
      { text: 'Updated GET /users test to omit auth header', dim: true },
      { text: 'Added assertion for 401 status code', dim: true },
      { text: 'Re-running vitest...', dim: true },
      { text: 'PASS  src/routes.test.ts (8 tests)', dim: true },
      { text: 'All 24 tests passing', color: '' },
    ],
  },
]

/* ── Main ── */

export function ModernTaskPipeline() {
  const colors = useTheme()
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [frame, setFrame] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [runId, setRunId] = useState(0)
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return
      setFrame(f => f + 1)
    }, 80)
    return () => clearInterval(id)
  }, [])

  const allFinished = tasks.every(t => t.status === 'done' || t.status === 'error')

  useEffect(() => {
    if (allFinished) return
    const id = setInterval(() => {
      if (pausedRef.current) return
      setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [allFinished])

  // Auto-progress pipeline
  useEffect(() => {
    const timers = [
      setTimeout(() => setTasks(t => t.map(tk => tk.id === 'read' ? { ...tk, status: 'done' } : tk.id === 'plan' ? { ...tk, status: 'running' } : tk)), 2000),
      setTimeout(() => setTasks(t => t.map(tk => tk.id === 'plan' ? { ...tk, status: 'done' } : tk.id === 'edit' ? { ...tk, status: 'running' } : tk)), 4000),
      setTimeout(() => setTasks(t => t.map(tk => tk.id === 'edit' ? { ...tk, status: 'done' } : tk.id === 'test' ? { ...tk, status: 'running' } : tk)), 6000),
      setTimeout(() => setTasks(t => t.map(tk => tk.id === 'test' ? { ...tk, status: 'error', detail: '1 failure' } : tk.id === 'fix' ? { ...tk, status: 'running' } : tk)), 8000),
      setTimeout(() => setTasks(t => t.map(tk => tk.id === 'fix' ? { ...tk, status: 'done' } : tk)), 10000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch, key) => {
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

  const doneCount = tasks.filter(t => t.status === 'done').length
  const errCount = tasks.filter(t => t.status === 'error').length
  const allDone = allFinished

  const statusColor = errCount > 0 ? colors.error : allDone ? colors.success : colors.info

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Box gap={1}>
            <Text bold color={colors.primary}>Agent Task</Text>
            {paused && <Badge label="PAUSED" color={colors.warning} />}
          </Box>
          <Box gap={1}>
            <Text dimColor>{elapsed}s</Text>
            <Text color={statusColor}>{doneCount}/{tasks.length}</Text>
          </Box>
        </Box>

        {tasks.map((task, i) => {
          const isLast = i === tasks.length - 1
          const hasRun = task.status !== 'pending'
          const lineColor = task.status === 'done' ? colors.success : task.status === 'error' ? colors.error : task.status === 'running' ? colors.primary : 'gray'
          const taskColor = task.status === 'running' ? blendHex(colors.primary, colors.secondary, Math.sin(frame * 0.1) * 0.5 + 0.5) : lineColor

          return (
            <Box key={task.id} flexDirection="column">
              <Box gap={1}>
                <StatusIcon status={task.status} frame={frame} color={taskColor} />
                <Text bold={task.status === 'running'} color={task.status === 'running' ? colors.primary : task.status === 'done' ? colors.success : task.status === 'error' ? colors.error : undefined} dimColor={task.status === 'pending'}>
                  {task.label}
                </Text>
                {task.detail && (
                  <Text dimColor={task.status !== 'error'} color={task.status === 'error' ? colors.error : undefined}>
                    {'\u2500 ' + task.detail}
                  </Text>
                )}
              </Box>

              {expanded && hasRun && (
                <Box flexDirection="column">
                  {task.logs.map((log, li) => (
                    <Box key={li} gap={1}>
                      <Text color={lineColor}>{'\u2502'}</Text>
                      <Text
                        dimColor={log.dim}
                        color={log.color === '' ? (task.status === 'error' ? colors.error : task.status === 'done' ? colors.success : colors.info) : log.color}
                      >
                        {log.text}
                      </Text>
                    </Box>
                  ))}
                </Box>
              )}

              {!isLast && (
                <Box>
                  <Text color={task.status === 'done' ? colors.success : task.status === 'error' ? colors.error : 'gray'}>
                    {'\u2502'}
                  </Text>
                </Box>
              )}
            </Box>
          )
        })}

        {allDone && (
          <Box marginTop={1}>
            <Text color={errCount > 0 ? colors.warning : colors.success} bold>
              {errCount > 0 ? `\u26A0 Completed with ${errCount} error${errCount > 1 ? 's' : ''}` : '\u2728 All tasks completed successfully'}
            </Text>
          </Box>
        )}

        <HelpFooter keys={[
          { key: 'd', label: expanded ? 'collapse' : 'details' },
          { key: 'space', label: paused ? 'resume' : 'pause' },
          { key: 'r', label: 'restart' },
        ]} />
      </Card>
    </Box>
  )
}
