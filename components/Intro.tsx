import { useEffect, useRef, useState, useCallback } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

/* ── ASCII Art ── */

const LINES = [
  '██╗███╗   ██╗██╗  ██╗   ██╗    ██╗███████╗██████╗ ',
  '██║████╗  ██║██║ ██╔╝   ██║    ██║██╔════╝██╔══██╗',
  '██║██╔██╗ ██║█████╔╝    ██║ █╗ ██║█████╗  ██████╔╝',
  '██║██║╚██╗██║██╔═██╗    ██║███╗██║██╔══╝  ██╔══██╗',
  '██║██║ ╚████║██║  ██╗   ╚███╔███╔╝███████╗██████╔╝',
  '╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝    ╚══╝╚══╝ ╚══════╝╚═════╝',
]

const SUBTITLE = 'React  for  Terminal  UIs'
const TARGET_ROW = 8
const DURATION = 2200
const FADE_START = 0.05
const SUBTITLE_DELAY = 0.7

/* ── Color Interpolation ── */

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function lerpColor(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from)
  const [r2, g2, b2] = hexToRgb(to)
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  )
}

/* ── Easing ── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

/* ── Component ── */

export function Intro() {
  const colors = useTheme()

  const progressRef = useRef(0)
  const startTimeRef = useRef(0)
  const rafRef = useRef(0)
  const [, setTick] = useState(0)
  const [playing, setPlaying] = useState(true)

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time
    const elapsed = time - startTimeRef.current
    const t = Math.min(1, elapsed / DURATION)

    progressRef.current = t
    setTick(tick => tick + 1)

    if (t < 1) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      setPlaying(false)
    }
  }, [])

  const start = useCallback(() => {
    progressRef.current = 0
    startTimeRef.current = 0
    setPlaying(true)
    rafRef.current = requestAnimationFrame(animate)
  }, [animate])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate])

  useInput((ch) => {
    if (ch === 'r' && !playing) {
      start()
    }
  })

  const raw = progressRef.current
  const posProgress = easeOutQuint(raw)
  const fadeProgress = easeOutCubic(Math.max(0, (raw - FADE_START) / (1 - FADE_START)))
  const subtitleProgress = easeOutCubic(Math.max(0, (raw - SUBTITLE_DELAY) / (1 - SUBTITLE_DELAY)))

  // Vertical position: top → center
  const topPad = Math.round(posProgress * TARGET_ROW)

  // Text color: dark → primary
  const textColor = lerpColor('#111111', colors.primary, fadeProgress)

  // Shadow color: slightly behind the main color
  const shadowT = Math.max(0, fadeProgress - 0.3) / 0.7
  const shadowColor = lerpColor('#111111', colors.secondary, shadowT * 0.4)

  // Subtitle color
  const subColor = lerpColor('#111111', '#aaaaaa', subtitleProgress)

  // Character reveal: left-to-right sweep
  const maxLen = LINES.reduce((m, l) => Math.max(m, l.length), 0)
  const totalStagger = (LINES.length - 1) * 2
  const charsRevealed = Math.floor((maxLen + totalStagger) * Math.min(1, fadeProgress * 1.4))

  return (
    <Box flexDirection="column" alignItems="center">
      {/* Vertical spacer */}
      {Array.from({ length: topPad }).map((_, i) => (
        <Box key={`sp-${i}`}><Text> </Text></Box>
      ))}

      {/* ASCII art */}
      {LINES.map((line, i) => {
        // Stagger reveal per line
        const lineDelay = i * 2
        const visible = Math.max(0, charsRevealed - lineDelay)
        const shown = line.slice(0, visible)
        const hidden = ' '.repeat(Math.max(0, line.length - visible))

        return (
          <Box key={i}>
            <Text color={textColor}>{shown}</Text>
            <Text color={shadowColor}>{hidden}</Text>
          </Box>
        )
      })}

      {/* Subtitle */}
      {subtitleProgress > 0 && (
        <Box marginTop={1}>
          <Text color={subColor}>{SUBTITLE}</Text>
        </Box>
      )}

    </Box>
  )
}
