import { useEffect, useRef, useState, useCallback } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

/* ── Spring Physics ── */

interface SpringState {
  position: number
  velocity: number
}

function updateSpring(
  pos: number,
  vel: number,
  target: number,
  stiffness: number,
  damping: number,
  dt: number,
): SpringState {
  // Semi-implicit Euler (symplectic) for better stability
  const displacement = pos - target
  const acceleration = -stiffness * displacement - damping * vel
  const newVel = vel + acceleration * dt
  const newPos = pos + newVel * dt
  return { position: newPos, velocity: newVel }
}

function isSettled(pos: number, vel: number, target: number): boolean {
  return Math.abs(pos - target) < 0.05 && Math.abs(vel) < 0.1
}

/* ── Presets ── */

interface Preset {
  label: string
  dampingRatio: number
  stiffness: number
  damping: number
  colorKey: 'success' | 'info' | 'warning'
  description: string
}

const STIFFNESS = 120
const CRITICAL_DAMPING = 2 * Math.sqrt(STIFFNESS)

const PRESETS: Preset[] = [
  {
    label: 'Bouncy',
    dampingRatio: 0.3,
    stiffness: STIFFNESS,
    damping: 0.3 * CRITICAL_DAMPING,
    colorKey: 'success',
    description: 'Underdamped — overshoots and oscillates',
  },
  {
    label: 'Smooth',
    dampingRatio: 1.0,
    stiffness: STIFFNESS,
    damping: 1.0 * CRITICAL_DAMPING,
    colorKey: 'info',
    description: 'Critically damped — fastest, no overshoot',
  },
  {
    label: 'Heavy',
    dampingRatio: 2.0,
    stiffness: STIFFNESS,
    damping: 2.0 * CRITICAL_DAMPING,
    colorKey: 'warning',
    description: 'Overdamped — slow, no oscillation',
  },
]

const TRACK_WIDTH = 40

/* ── Track Renderer ── */

function SpringTrack({
  position,
  velocity,
  preset,
  color,
  target,
}: {
  position: number
  velocity: number
  preset: Preset
  color: string
  target: number
}) {
  const pos = Math.round(Math.max(0, Math.min(TRACK_WIDTH - 1, position)))
  const tgt = Math.round(target)

  const parts: string[] = []
  for (let i = 0; i < TRACK_WIDTH; i++) {
    parts.push(i === pos ? '' : i === tgt ? '' : '─')
  }

  const vel = Math.abs(velocity)
  const barLen = Math.min(10, Math.round(vel / 3))

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text bold color={color}>{preset.label.padEnd(8)}</Text>
        <Box>
          {parts.map((ch, i) => {
            if (i === pos) return <Text key={i} color={color} bold>●</Text>
            if (i === tgt) return <Text key={i} dimColor>◆</Text>
            return <Text key={i} dimColor>─</Text>
          })}
        </Box>
      </Box>
      <Box gap={1} marginLeft={9}>
        <Text dimColor>vel:</Text>
        <Text color={color}>{'█'.repeat(barLen).padEnd(10)}</Text>
        <Text dimColor>{vel.toFixed(1).padStart(6)}</Text>
        <Text dimColor>  {preset.description}</Text>
      </Box>
    </Box>
  )
}

/* ── Main Component ── */

export function SpringAnimation() {
  const colors = useTheme()

  // Animation state lives in refs to avoid React reconciliation per frame
  const springsRef = useRef<SpringState[]>(PRESETS.map(() => ({ position: 0, velocity: 0 })))
  const targetRef = useRef(0)
  const animatingRef = useRef(false)
  const rafRef = useRef(0)
  const prevTimeRef = useRef(0)

  // Single render tick — incremented to trigger one React re-render per frame
  const [, setTick] = useState(0)

  const animate = useCallback((time: number) => {
    // Compute actual delta time from rAF timestamp (capped at 50ms to prevent spiral)
    const dt = prevTimeRef.current ? Math.min((time - prevTimeRef.current) / 1000, 0.05) : 1 / 60
    prevTimeRef.current = time

    const target = targetRef.current
    const springs = springsRef.current
    let allSettled = true

    for (let i = 0; i < springs.length; i++) {
      const s = springs[i]!
      const p = PRESETS[i]!

      if (isSettled(s.position, s.velocity, target)) {
        // Snap to target when settled
        s.position = target
        s.velocity = 0
      } else {
        const next = updateSpring(s.position, s.velocity, target, p.stiffness, p.damping, dt)
        s.position = next.position
        s.velocity = next.velocity
        allSettled = false
      }
    }

    // Trigger a single React re-render
    setTick(t => t + 1)

    if (allSettled) {
      animatingRef.current = false
      prevTimeRef.current = 0
      return
    }

    // Request next frame (demand-driven — stops when settled)
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  const startAnimation = useCallback(() => {
    if (!animatingRef.current) {
      animatingRef.current = true
      prevTimeRef.current = 0
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [animate])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useInput((ch, key) => {
    if (ch === ' ' || key.rightArrow || key.leftArrow) {
      targetRef.current = targetRef.current === 0 ? TRACK_WIDTH - 1 : 0
      startAnimation()
    } else if (ch === 'r') {
      cancelAnimationFrame(rafRef.current)
      animatingRef.current = false
      prevTimeRef.current = 0
      springsRef.current = PRESETS.map(() => ({ position: 0, velocity: 0 }))
      targetRef.current = 0
      setTick(t => t + 1)
    }
  })

  const springs = springsRef.current
  const target = targetRef.current

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Spring Animation</Text>
        <Text dimColor>Harmonica-inspired physics</Text>
        {animatingRef.current && <Text color={colors.success}>●</Text>}
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Damping ratios: </Text>
        {PRESETS.map((p, i) => (
          <Box key={p.label} gap={0}>
            {i > 0 && <Text dimColor>{'  '}</Text>}
            <Text color={colors[p.colorKey]} bold>{p.label}</Text>
            <Text dimColor>={p.dampingRatio}</Text>
          </Box>
        ))}
      </Box>

      <Box flexDirection="column" gap={1} marginTop={1}>
        {springs.map((spring, i) => {
          const preset = PRESETS[i]!
          return (
            <SpringTrack
              key={preset.label}
              position={spring.position}
              velocity={spring.velocity}
              preset={preset}
              color={colors[preset.colorKey]}
              target={target}
            />
          )
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          stiffness={STIFFNESS}  critical_damping={CRITICAL_DAMPING.toFixed(1)}  rAF sync
        </Text>
      </Box>

      <Box marginTop={1} gap={1}>
        <Text dimColor>
          <Text bold>space</Text> animate  <Text bold>←/→</Text> toggle target  <Text bold>r</Text> reset
        </Text>
      </Box>
    </Box>
  )
}
