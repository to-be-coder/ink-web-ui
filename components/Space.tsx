import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

const HALF_BLOCK = '▀'
const WIDTH = 60
const PIXEL_HEIGHT = 40 // doubled for half-blocks
const RENDER_HEIGHT = PIXEL_HEIGHT / 2

function generateColorGrid(): string[][] {
  const grid: string[][] = []
  for (let y = 0; y < PIXEL_HEIGHT; y++) {
    const row: string[] = []
    for (let x = 0; x < WIDTH; x++) {
      const depthFactor = (PIXEL_HEIGHT - y) / PIXEL_HEIGHT
      const base = depthFactor * depthFactor
      const randomOffset = (Math.random() * 0.2) - 0.1
      const value = Math.max(0, Math.min(1, base + randomOffset))
      const gray = Math.round(value * 255)
      const hex = gray.toString(16).padStart(2, '0')
      row.push(`#${hex}${hex}${hex}`)
    }
    grid.push(row)
  }
  return grid
}

export function Space() {
  const colors = useTheme()
  const [, setTick] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const gridRef = useRef<string[][]>(generateColorGrid())
  const frameRef = useRef(0)

  useInput((ch) => {
    if (ch === ' ') setPaused(p => !p)
  })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      if (!pausedRef.current) {
        frameRef.current++
      }
      setTick(t => t + 1)
      timer = setTimeout(tick, 16) // ~60fps
    }
    timer = setTimeout(tick, 16)
    return () => clearTimeout(timer)
  }, [])

  const grid = gridRef.current
  const frame = frameRef.current

  const rows: { fg: string; bg: string }[][] = []
  for (let row = 0; row < RENDER_HEIGHT; row++) {
    const cells: { fg: string; bg: string }[] = []
    for (let x = 0; x < WIDTH; x++) {
      const xi = (x + frame) % WIDTH
      const topRow = grid[row * 2]
      const botRow = grid[row * 2 + 1]
      cells.push({
        fg: topRow?.[xi] ?? '#000000',
        bg: botRow?.[xi] ?? '#000000',
      })
    }
    rows.push(cells)
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={0} gap={2}>
        <Text bold color={colors.primary}>Space</Text>
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
      </Box>
    </Box>
  )
}
