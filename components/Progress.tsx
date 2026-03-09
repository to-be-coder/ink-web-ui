import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// --- Progress bar rendering (matching bubbles/progress) ---

// Half-block character for sub-character precision
const FULL_BLOCK = '█'
const HALF_BLOCK = '▌'
const EMPTY_BLOCK = '░'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`
}

function blendColor(colorA: string, colorB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(colorA)
  const [r2, g2, b2] = hexToRgb(colorB)
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t))
}

// --- Spring physics for smooth animation ---

interface Spring {
  position: number
  velocity: number
  target: number
}

function stepSpring(spring: Spring, dt: number, stiffness: number, damping: number): Spring {
  const force = -stiffness * (spring.position - spring.target)
  const dampForce = -damping * spring.velocity
  const velocity = spring.velocity + (force + dampForce) * dt
  const position = spring.position + velocity * dt
  return { ...spring, position, velocity }
}

// --- Bar rendering ---

interface BarConfig {
  width: number
  percent: number
  fillColor: string
  emptyColor: string
  gradient?: { start: string; end: string }
  showPercent: boolean
  label: string
  fillChar?: string
  emptyChar?: string
}

function renderBar(config: BarConfig): { segments: { text: string; color: string }[]; percentText: string } {
  const { width, percent, fillColor, gradient, fillChar = FULL_BLOCK, emptyChar = EMPTY_BLOCK } = config
  const p = Math.max(0, Math.min(1, percent))
  const filledExact = p * width
  const filledFull = Math.floor(filledExact)
  const hasHalf = filledExact - filledFull >= 0.5
  const emptyCount = width - filledFull - (hasHalf ? 1 : 0)

  const segments: { text: string; color: string }[] = []

  if (gradient) {
    // Gradient coloring - each filled char gets a blended color
    for (let i = 0; i < filledFull; i++) {
      const t = width > 1 ? i / (width - 1) : 0
      const color = blendColor(gradient.start, gradient.end, t)
      segments.push({ text: fillChar, color })
    }
    if (hasHalf) {
      const t = width > 1 ? filledFull / (width - 1) : 0
      const color = blendColor(gradient.start, gradient.end, t)
      segments.push({ text: HALF_BLOCK, color })
    }
  } else {
    // Solid color
    if (filledFull > 0) {
      segments.push({ text: fillChar.repeat(filledFull), color: fillColor })
    }
    if (hasHalf) {
      segments.push({ text: HALF_BLOCK, color: fillColor })
    }
  }

  if (emptyCount > 0) {
    segments.push({ text: emptyChar.repeat(emptyCount), color: '#333333' })
  }

  const percentText = `${Math.round(p * 100)}%`
  return { segments, percentText }
}

// --- Demo tasks ---

interface TaskProgress {
  label: string
  targetPercent: number
  spring: Spring
  fillColor: string
  gradient?: { start: string; end: string }
  fillChar: string
  emptyChar: string
  width: number
}

const BAR_WIDTH = 40

export function Progress() {
  const colors = useTheme()
  const [, setTick] = useState(0)
  const [paused, setPaused] = useState(false)

  const tasksRef = useRef<TaskProgress[]>([
    {
      label: 'Downloading',
      targetPercent: 0,
      spring: { position: 0, velocity: 0, target: 0 },
      fillColor: colors.primary,
      fillChar: FULL_BLOCK,
      emptyChar: EMPTY_BLOCK,
      width: BAR_WIDTH,
    },
    {
      label: 'Compiling',
      targetPercent: 0,
      spring: { position: 0, velocity: 0, target: 0 },
      fillColor: colors.info,
      gradient: { start: colors.info, end: colors.primary },
      fillChar: FULL_BLOCK,
      emptyChar: EMPTY_BLOCK,
      width: BAR_WIDTH,
    },
    {
      label: 'Testing',
      targetPercent: 0,
      spring: { position: 0, velocity: 0, target: 0 },
      fillColor: colors.success,
      fillChar: '▰',
      emptyChar: '▱',
      width: BAR_WIDTH,
    },
    {
      label: 'Deploying',
      targetPercent: 0,
      spring: { position: 0, velocity: 0, target: 0 },
      fillColor: colors.warning,
      gradient: { start: colors.success, end: colors.error },
      fillChar: FULL_BLOCK,
      emptyChar: ' ',
      width: BAR_WIDTH,
    },
  ])

  const lastTsRef = useRef(0)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useInput((ch) => {
    if (ch === ' ') setPaused((p) => !p)
    else if (ch === 'r') {
      for (const t of tasksRef.current) {
        t.targetPercent = 0
        t.spring = { position: 0, velocity: 0, target: 0 }
      }
    }
  })

  const animate = useCallback(() => {
    const now = performance.now()
    const dt = lastTsRef.current ? Math.min((now - lastTsRef.current) / 1000, 0.1) : 1 / 60
    lastTsRef.current = now

    const tasks = tasksRef.current

    if (!pausedRef.current) {
      // Advance targets at different speeds
      const speeds = [0.12, 0.08, 0.15, 0.06]
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].targetPercent < 1) {
          tasks[i].targetPercent = Math.min(1, tasks[i].targetPercent + dt * speeds[i])
        }
        tasks[i].spring.target = tasks[i].targetPercent
      }
    }

    // Step springs
    for (const task of tasks) {
      task.spring = stepSpring(task.spring, dt, 4, 3)
    }

    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let raf: number
    const loop = () => {
      animate()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [animate])

  const tasks = tasksRef.current
  const allDone = tasks.every((t) => t.targetPercent >= 1 && Math.abs(t.spring.position - 1) < 0.01)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Progress</Text>
        {paused && <Text color={colors.warning}>paused</Text>}
        {allDone && <Text color={colors.success}>complete</Text>}
      </Box>

      {tasks.map((task) => {
        const p = Math.max(0, Math.min(1, task.spring.position))
        const bar = renderBar({
          width: task.width,
          percent: p,
          fillColor: task.fillColor,
          emptyColor: '#333333',
          gradient: task.gradient,
          showPercent: true,
          label: task.label,
          fillChar: task.fillChar,
          emptyChar: task.emptyChar,
        })
        const done = task.targetPercent >= 1 && Math.abs(p - 1) < 0.01

        return (
          <Box key={task.label} flexDirection="column" marginBottom={1}>
            <Box gap={1}>
              <Text color={done ? colors.success : 'white'} bold>
                {done ? '✓' : '○'} {task.label}
              </Text>
            </Box>
            <Box marginLeft={2}>
              {bar.segments.map((seg, i) => (
                <Text key={i} color={seg.color}>{seg.text}</Text>
              ))}
              <Text dimColor> {bar.percentText}</Text>
            </Box>
          </Box>
        )
      })}

      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> space </Text><Text dimColor> {paused ? 'resume' : 'pause'}</Text></Box>
        <Box><Text inverse bold> r </Text><Text dimColor> reset</Text></Box>
      </Box>
    </Box>
  )
}
