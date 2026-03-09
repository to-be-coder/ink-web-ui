import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

const HALF_BLOCK = '▀'
const WIDTH = 60
const HEIGHT = 20 // each row = 2 pixel rows

const RAINBOW = [
  [0x88, 0x11, 0x77],
  [0xaa, 0x33, 0x55],
  [0xcc, 0x66, 0x66],
  [0xee, 0x99, 0x44],
  [0xee, 0xdd, 0x00],
  [0x99, 0xdd, 0x55],
  [0x44, 0xdd, 0x88],
  [0x22, 0xcc, 0xbb],
  [0x00, 0xbb, 0xcc],
  [0x00, 0x99, 0xcc],
  [0x33, 0x66, 0xbb],
  [0x66, 0x33, 0x99],
] as const

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function colorAtPosition(pos: number): string {
  // Normalize to 0-1, wrapping
  let p = ((pos % 1) + 1) % 1
  const idx = p * (RAINBOW.length - 1)
  const i = Math.floor(idx)
  const t = idx - i
  const c1 = RAINBOW[i] ?? RAINBOW[0]!
  const c2 = RAINBOW[Math.min(i + 1, RAINBOW.length - 1)] ?? RAINBOW[0]!
  const r = Math.round(lerp(c1[0], c2[0], t))
  const g = Math.round(lerp(c1[1], c2[1], t))
  const b = Math.round(lerp(c1[2], c2[2], t))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function Splash() {
  const colors = useTheme()
  const [, setFrame] = useState(0)
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(90)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const startRef = useRef(Date.now())

  useInput((ch) => {
    if (ch === ' ') setPaused(p => !p)
    else if (ch === '1') setSpeed(45)
    else if (ch === '2') setSpeed(90)
    else if (ch === '3') setSpeed(180)
  })

  useEffect(() => {
    let raf: ReturnType<typeof setTimeout>
    const tick = () => {
      if (!pausedRef.current) {
        setFrame(f => f + 1)
      }
      raf = setTimeout(tick, 16) // ~60fps
    }
    raf = setTimeout(tick, 16)
    return () => clearTimeout(raf)
  }, [])

  const elapsed = paused ? 0 : (Date.now() - startRef.current)
  const t = (elapsed * speed) / 1000
  const angle = (-t * Math.PI) / 180
  const sinA = Math.sin(angle)
  const cosA = Math.cos(angle)

  const centerX = WIDTH / 2
  const centerY = HEIGHT

  // Build pixel grid
  const rows: { fg: string; bg: string }[][] = []
  for (let row = 0; row < HEIGHT; row++) {
    const cells: { fg: string; bg: string }[] = []
    for (let x = 0; x < WIDTH; x++) {
      // Top pixel (row * 2)
      const py1 = row * 2 - centerY
      const px1 = x - centerX
      const pos1 = (centerX + (px1 * cosA - py1 * sinA)) / WIDTH

      // Bottom pixel (row * 2 + 1)
      const py2 = row * 2 + 1 - centerY
      const pos2 = (centerX + (px1 * cosA - py2 * sinA)) / WIDTH

      cells.push({
        fg: colorAtPosition(pos1),
        bg: colorAtPosition(pos2),
      })
    }
    rows.push(cells)
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={0} gap={2}>
        <Text bold color={colors.primary}>Splash</Text>
        <Text dimColor>speed: {speed === 45 ? 'slow' : speed === 90 ? 'normal' : 'fast'}</Text>
        {paused && <Text color={colors.warning}>paused</Text>}
      </Box>

      {rows.map((cells, ri) => (
        <Box key={ri}>
          {cells.map((c, ci) => (
            <Text key={ci} color={c.fg} backgroundColor={c.bg}>
              {HALF_BLOCK}
            </Text>
          ))}
        </Box>
      ))}

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> space </Text>
          <Text dimColor> {paused ? 'resume' : 'pause'}</Text>
        </Box>
        <Box>
          <Text inverse bold> 1/2/3 </Text>
          <Text dimColor> speed</Text>
        </Box>
      </Box>
    </Box>
  )
}
