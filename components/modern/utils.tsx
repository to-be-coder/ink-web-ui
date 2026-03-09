import React from 'react'
import { Box, Text } from 'ink-web'
import { useTheme } from '../theme'

/* ── Card ── */

interface CardProps {
  children: React.ReactNode
  title?: string
  focused?: boolean
  width?: number
  borderColor?: string
  paddingX?: number
  paddingY?: number
}

export function Card({ children, title, focused, width, borderColor, paddingX, paddingY }: CardProps) {
  const colors = useTheme()
  const bc = borderColor ?? (focused === false ? 'gray' : colors.primary)

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={bc}
      overflow="hidden"
      paddingX={paddingX ?? 2}
      paddingY={paddingY ?? 1}
      width={width}
    >
      {title && (
        <Box marginBottom={1}>
          <Text bold color={bc}>{title}</Text>
        </Box>
      )}
      {children}
    </Box>
  )
}

/* ── GBar (Guide Bar) ── */

export type BarSymbol = 'active' | 'done' | 'pending' | 'error' | 'bar'

export function GBar({ kind, color }: { kind: BarSymbol; color?: string }) {
  const colors = useTheme()
  const symbols: Record<BarSymbol, string> = {
    active: '\u25C6',
    done: '\u25C7',
    pending: '\u25CB',
    error: '\u25B2',
    bar: '\u2502',
  }
  const symColors: Record<BarSymbol, string> = {
    active: colors.primary,
    done: colors.success,
    pending: 'gray',
    error: colors.warning,
    bar: 'gray',
  }
  return <Text color={color ?? symColors[kind]}>{symbols[kind]}  </Text>
}

/* ── Separator ── */

export function Separator({ color, width, label }: { color?: string; width?: number; label?: string } = {}) {
  if (label) {
    const line = '\u2500'.repeat(width ?? 100)
    return (
      <Box>
        <Text dimColor={!color} color={color} wrap="truncate-end">{'\u2500\u2500 '}</Text>
        <Text dimColor color={color}>{label}</Text>
        <Text dimColor={!color} color={color} wrap="truncate-end">{' ' + line}</Text>
      </Box>
    )
  }
  return (
    <Text dimColor={!color} color={color} wrap="truncate-end">
      {'\u2500'.repeat(width ?? 200)}
    </Text>
  )
}

/* ── HelpFooter ── */

interface HelpKey {
  key: string
  label: string
}

export function HelpFooter({ keys }: { keys: HelpKey[] }) {
  return (
    <Box marginTop={1} gap={2}>
      {keys.map((k) => (
        <Box key={k.key + k.label}>
          <Text inverse bold> {k.key} </Text>
          <Text dimColor> {k.label}</Text>
        </Box>
      ))}
    </Box>
  )
}

/* ── StatusDot ── */

export function StatusDot({
  active,
  color,
}: {
  active: boolean
  color?: string
}) {
  const colors = useTheme()
  const c = color ?? (active ? colors.success : 'gray')
  return <Text color={c}>{active ? '\u25CF' : '\u25CB'}</Text>
}

/* ── Badge (Pill) ── */

export function Badge({ label, color, dimmed }: { label: string; color?: string; dimmed?: boolean }) {
  const colors = useTheme()
  if (dimmed) return <Text dimColor> {label} </Text>
  return <Text inverse bold color={color ?? colors.primary}> {label} </Text>
}

/* ── Sparkline ── */

const SPARK_CHARS = ['\u2581', '\u2582', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2588']

export function Sparkline({ values, color, width }: { values: number[]; color?: string; width?: number }) {
  const colors = useTheme()
  const w = width ?? values.length
  const data = values.slice(-w)
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const chars = data.map(v => {
    const idx = Math.round(((v - min) / range) * (SPARK_CHARS.length - 1))
    return SPARK_CHARS[idx]!
  }).join('')
  return <Text color={color ?? colors.info}>{chars}</Text>
}

/* ── ProgressBar ── */

export function ProgressBar({
  value,
  width,
  filled,
  empty,
  colorFrom,
  colorTo,
  showPercent,
}: {
  value: number
  width?: number
  filled?: string
  empty?: string
  colorFrom?: string
  colorTo?: string
  showPercent?: boolean
}) {
  const colors = useTheme()
  const w = width ?? 30
  const pct = Math.max(0, Math.min(1, value))
  const filledCount = Math.round(pct * w)
  const emptyCount = w - filledCount
  const f = filled ?? '\u2588'
  const e = empty ?? '\u2591'
  const c1 = colorFrom ?? colors.primary
  const c2 = colorTo ?? colors.success

  const filledStr = f.repeat(filledCount)
  const emptyStr = e.repeat(emptyCount)

  const blended = blendHex(c1, c2, pct)

  return (
    <Box>
      <Text color={blended}>{filledStr}</Text>
      <Text dimColor>{emptyStr}</Text>
      {showPercent && <Text dimColor> {Math.round(pct * 100)}%</Text>}
    </Box>
  )
}

/* ── Color utilities ── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

export function blendHex(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1)
  const [r2, g2, b2] = hexToRgb(c2)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

/* ── Braille spinner frames ── */

export const BRAILLE_FRAMES = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F']
export const DOT_FRAMES = ['\u2804', '\u2806', '\u2807', '\u280B', '\u2819', '\u2838', '\u2830', '\u2820']
export const BOUNCE_FRAMES = ['\u2801', '\u2802', '\u2804', '\u2840', '\u2880', '\u2820', '\u2810', '\u2808']
export const ARC_FRAMES = ['\u25DC', '\u25E0', '\u25DD', '\u25DE', '\u25E1', '\u25DF']
export const ARROW_FRAMES = ['\u2190', '\u2196', '\u2191', '\u2197', '\u2192', '\u2198', '\u2193', '\u2199']
