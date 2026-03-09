import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Separator, Sparkline, blendHex } from './utils'

/* ── Spring physics ── */

function stepSpring(pos: number, vel: number, target: number, stiffness: number, damping: number, dt: number) {
  const force = (target - pos) * stiffness
  const damp = -vel * damping
  const nv = vel + (force + damp) * dt
  const np = pos + nv * dt
  return { pos: np, vel: nv }
}

/* ── Bar rendering ── */

const BLOCKS = [' ', '\u258F', '\u258E', '\u258D', '\u258C', '\u258B', '\u258A', '\u2589', '\u2588']

function renderBar(pct: number, width: number, c1: string, c2: string): { filled: string; empty: string; color: string } {
  const total = pct * width
  const full = Math.floor(total)
  const frac = total - full
  const fracIdx = Math.round(frac * (BLOCKS.length - 1))
  const filledStr = '\u2588'.repeat(full) + (fracIdx > 0 ? BLOCKS[fracIdx]! : '')
  const emptyStr = '\u2591'.repeat(width - full - (fracIdx > 0 ? 1 : 0))
  return { filled: filledStr, empty: emptyStr, color: blendHex(c1, c2, pct) }
}

/* ── Task type ── */

interface Task {
  id: string
  label: string
  target: number
  speed: number
  colorFrom: string
  colorTo: string
  history: number[]
}

/* ── Main ── */

export function ModernProgress() {
  const colors = useTheme()
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'download', label: 'Downloading packages', target: 1, speed: 0.008, colorFrom: colors.info, colorTo: colors.success, history: [] },
    { id: 'compile', label: 'Compiling source', target: 1, speed: 0.005, colorFrom: colors.primary, colorTo: colors.secondary, history: [] },
    { id: 'optimize', label: 'Optimizing assets', target: 1, speed: 0.012, colorFrom: colors.warning, colorTo: colors.success, history: [] },
    { id: 'upload', label: 'Uploading artifacts', target: 1, speed: 0.003, colorFrom: colors.secondary, colorTo: colors.info, history: [] },
  ])
  const [positions, setPositions] = useState<number[]>([0, 0, 0, 0])
  const [velocities, setVelocities] = useState<number[]>([0, 0, 0, 0])
  const [targets, setTargets] = useState<number[]>([0, 0, 0, 0])
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return
      setTargets(prev => prev.map((t, i) => Math.min(1, t + tasks[i]!.speed)))
    }, 100)
    return () => clearInterval(id)
  }, [tasks])

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return
      setPositions(prev => {
        const newPos: number[] = []
        const newVel: number[] = []
        for (let i = 0; i < prev.length; i++) {
          const s = stepSpring(prev[i]!, velocities[i]!, targets[i]!, 120, 14, 0.016)
          newPos.push(Math.max(0, Math.min(1, s.pos)))
          newVel.push(s.vel)
        }
        setVelocities(newVel)
        return newPos
      })
      setTasks(prev => prev.map((t, i) => ({
        ...t,
        history: [...t.history.slice(-29), positions[i] ?? 0],
      })))
    }, 16)
    return () => clearInterval(id)
  }, [targets, velocities, positions])

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return
      setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useInput((ch) => {
    if (ch === ' ') {
      pausedRef.current = !pausedRef.current
      setPaused(p => !p)
    }
    if (ch === 'r') {
      setPositions([0, 0, 0, 0])
      setVelocities([0, 0, 0, 0])
      setTargets([0, 0, 0, 0])
      setTasks(t => t.map(tk => ({ ...tk, history: [] })))
      setElapsed(0)
    }
  })

  const allDone = positions.every(p => p >= 0.99)
  const totalPct = positions.reduce((a, b) => a + b, 0) / positions.length
  const barWidth = 32

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>Build Progress</Text>
          <Box gap={2}>
            <Text dimColor>{elapsed}s</Text>
            <Text color={allDone ? colors.success : colors.info} bold>{Math.round(totalPct * 100)}%</Text>
          </Box>
        </Box>

        {tasks.map((task, i) => {
          const pct = positions[i]!
          const done = pct >= 0.99
          const { filled, empty, color } = renderBar(pct, barWidth, task.colorFrom, task.colorTo)

          return (
            <Box key={task.id} flexDirection="column" marginBottom={i < tasks.length - 1 ? 1 : 0}>
              <Box justifyContent="space-between">
                <Box gap={1}>
                  <Text color={done ? colors.success : color}>{done ? '\u2714' : '\u25CF'}</Text>
                  <Text bold={!done} color={done ? colors.success : undefined} dimColor={done}>{task.label}</Text>
                </Box>
                <Box gap={1}>
                  {task.history.length > 5 && <Sparkline values={task.history} color={color} width={12} />}
                  <Text color={color} bold>{Math.round(pct * 100).toString().padStart(3)}%</Text>
                </Box>
              </Box>
              <Box>
                <Text color={color}>{filled}</Text>
                <Text dimColor>{empty}</Text>
              </Box>
            </Box>
          )
        })}

        <Separator />

        <Box justifyContent="space-between" marginTop={0}>
          <Box gap={1}>
            <Text dimColor>Total</Text>
            {allDone && <Text color={colors.success} bold>Complete</Text>}
          </Box>
          <Box>
            {(() => {
              const { filled, empty, color } = renderBar(totalPct, 20, colors.primary, colors.success)
              return (
                <Box gap={1}>
                  <Box>
                    <Text color={color}>{filled}</Text>
                    <Text dimColor>{empty}</Text>
                  </Box>
                  <Text color={color} bold>{Math.round(totalPct * 100)}%</Text>
                </Box>
              )
            })()}
          </Box>
        </Box>

        <HelpFooter keys={[
          { key: 'space', label: paused ? 'resume' : 'pause' },
          { key: 'r', label: 'reset' },
        ]} />
      </Card>
    </Box>
  )
}
