import { useState, useEffect, useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface Process {
  pid: number
  name: string
  cpu: number
  mem: number
  status: 'running' | 'sleeping' | 'idle'
}

interface Stats {
  cpu: number
  memory: number
  disk: number
  network: { up: number; down: number }
  uptime: number
  processes: Process[]
}

const PROCESS_NAMES = [
  'node', 'next-server', 'typescript', 'eslint',
  'tailwindcss', 'xterm-render', 'ink-layout', 'vite',
  'bun', 'esbuild', 'turbopack', 'wasm-yoga',
]

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function generateProcesses(): Process[] {
  return PROCESS_NAMES.slice(0, 8).map((name, i) => ({
    pid: 1000 + i * 127,
    name,
    cpu: Math.round(randomBetween(0, 45) * 10) / 10,
    mem: Math.round(randomBetween(0.5, 12) * 10) / 10,
    status: Math.random() > 0.3 ? 'running' : Math.random() > 0.5 ? 'sleeping' : 'idle',
  }))
}

function generateStats(prev?: Stats): Stats {
  const drift = (base: number, amount: number) =>
    Math.max(5, Math.min(95, base + randomBetween(-amount, amount)))

  return {
    cpu: Math.round(drift(prev?.cpu ?? 42, 8)),
    memory: Math.round(drift(prev?.memory ?? 61, 3)),
    disk: Math.round(drift(prev?.disk ?? 73, 1)),
    network: {
      up: Math.round(randomBetween(10, 250)),
      down: Math.round(randomBetween(50, 900)),
    },
    uptime: (prev?.uptime ?? 0) + 1,
    processes: generateProcesses(),
  }
}

function ProgressBar({ value, width = 20, color }: { value: number; width?: number; color: string }) {
  const filled = Math.round((value / 100) * width)
  const empty = width - filled
  return (
    <Text>
      <Text color={color}>{'█'.repeat(filled)}</Text>
      <Text color="gray">{'░'.repeat(empty)}</Text>
      <Text bold> {value}%</Text>
    </Text>
  )
}

function barColor(value: number, colors: { success: string; warning: string; error: string }): string {
  if (value < 50) return colors.success
  if (value < 80) return colors.warning
  return colors.error
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getStatusColor(colors: { success: string; warning: string }): Record<string, string> {
  return {
    running: colors.success,
    sleeping: colors.warning,
    idle: 'gray',
  }
}

type SortKey = 'cpu' | 'mem' | 'name'

export function SystemMonitor() {
  const colors = useTheme()
  const [stats, setStats] = useState<Stats>(generateStats)
  const [paused, setPaused] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('cpu')

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      setStats(prev => generateStats(prev))
    }, 1000)
    return () => clearInterval(timer)
  }, [paused])

  useInput((ch) => {
    if (ch === 'p') setPaused(prev => !prev)
    else if (ch === 'c') setSortBy('cpu')
    else if (ch === 'm') setSortBy('mem')
    else if (ch === 'n') setSortBy('name')
  })

  const sorted = [...stats.processes].sort((a, b) => {
    if (sortBy === 'cpu') return b.cpu - a.cpu
    if (sortBy === 'mem') return b.mem - a.mem
    return a.name.localeCompare(b.name)
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}> System Monitor</Text>
        {paused && <Text color={colors.warning}>[PAUSED]</Text>}
        <Text dimColor>uptime {formatUptime(stats.uptime)}</Text>
      </Box>

      <Box gap={4}>
        <Box flexDirection="column">
          <Box gap={1}>
            <Text dimColor>{'CPU '.padEnd(7)}</Text>
            <ProgressBar value={stats.cpu} color={barColor(stats.cpu, colors)} />
          </Box>
          <Box gap={1}>
            <Text dimColor>{'Memory '.padEnd(7)}</Text>
            <ProgressBar value={stats.memory} color={barColor(stats.memory, colors)} />
          </Box>
          <Box gap={1}>
            <Text dimColor>{'Disk '.padEnd(7)}</Text>
            <ProgressBar value={stats.disk} color={barColor(stats.disk, colors)} />
          </Box>
        </Box>

        <Box flexDirection="column">
          <Text dimColor>Network</Text>
          <Text color={colors.success}>  ↑ {String(stats.network.up).padStart(4)} KB/s</Text>
          <Text color={colors.info}>  ↓ {String(stats.network.down).padStart(4)} KB/s</Text>
        </Box>
      </Box>

      <Box marginTop={1} marginBottom={0}>
        <Text dimColor>
          {'PID'.padEnd(7)}
          {'Name'.padEnd(15)}
          {'CPU %'.padEnd(9)}
          {'Mem %'.padEnd(9)}
          {'Status'}
        </Text>
      </Box>
      <Text dimColor>{'─'.repeat(50)}</Text>

      {sorted.map(proc => (
        <Box key={proc.pid}>
          <Text dimColor>{String(proc.pid).padEnd(7)}</Text>
          <Text>{proc.name.padEnd(15)}</Text>
          <Text color={proc.cpu > 30 ? colors.error : proc.cpu > 15 ? colors.warning : 'white'}>
            {proc.cpu.toFixed(1).padStart(5).padEnd(9)}
          </Text>
          <Text color={proc.mem > 8 ? colors.error : 'white'}>
            {proc.mem.toFixed(1).padStart(5).padEnd(9)}
          </Text>
          <Text color={getStatusColor(colors)[proc.status]}>{proc.status}</Text>
        </Box>
      ))}

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> p </Text>
          <Text dimColor> pause</Text>
        </Box>
        <Box>
          <Text inverse bold> c </Text>
          <Text dimColor> sort cpu</Text>
        </Box>
        <Box>
          <Text inverse bold> m </Text>
          <Text dimColor> sort mem</Text>
        </Box>
        <Box>
          <Text inverse bold> n </Text>
          <Text dimColor> sort name</Text>
        </Box>
      </Box>
    </Box>
  )
}
