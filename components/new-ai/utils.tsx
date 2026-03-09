import { Box, Text } from 'ink-web'
import { useTheme } from '../theme'

/* ── Spinner frames ── */
export const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/* ── Block chars for bars ── */
export const BAR = ['░', '▒', '▓', '█']

/* ── Badge (inverse pill) ── */
export function Badge({ label, color }: { label: string; color?: string }) {
  const colors = useTheme()
  return <Text inverse bold color={color ?? colors.primary}> {label} </Text>
}

/* ── Dim badge (subtle tag) ── */
export function Tag({ label, color }: { label: string; color?: string }) {
  const colors = useTheme()
  return (
    <Box borderStyle="round" borderColor={color ?? colors.primary} paddingLeft={1} paddingRight={1}>
      <Text color={color ?? colors.primary}>{label}</Text>
    </Box>
  )
}

/* ── Help footer ── */
export function Help({ keys }: { keys: { key: string; label: string }[] }) {
  return (
    <Box marginTop={1} gap={2}>
      {keys.map(k => (
        <Box key={k.key + k.label}>
          <Text inverse bold> {k.key} </Text>
          <Text dimColor> {k.label}</Text>
        </Box>
      ))}
    </Box>
  )
}

/* ── Separator ── */
export function Sep({ label, width = 60, color }: { label?: string; width?: number; color?: string }) {
  if (label) {
    const pad = Math.max(0, width - label.length - 4)
    return (
      <Box>
        <Text dimColor color={color}>{'─── '}</Text>
        <Text bold color={color}>{label}</Text>
        <Text dimColor color={color}>{' ' + '─'.repeat(pad)}</Text>
      </Box>
    )
  }
  return <Text dimColor color={color} wrap="truncate-end">{'─'.repeat(width)}</Text>
}

/* ── Dot indicator ── */
export function Dot({ color, filled = true }: { color: string; filled?: boolean }) {
  return <Text color={color}>{filled ? '●' : '○'}</Text>
}

/* ── Progress bar ── */
export function MiniBar({ value, max, width = 20, color }: { value: number; max: number; width?: number; color: string }) {
  const filled = Math.round((value / max) * width)
  const empty = width - filled
  return (
    <Text>
      <Text color={color}>{'█'.repeat(filled)}</Text>
      <Text dimColor>{'░'.repeat(empty)}</Text>
    </Text>
  )
}

/* ── Color blending ── */
export function blendHex(c1: string, c2: string, t: number): string {
  const parse = (h: string) => {
    const x = h.replace('#', '')
    return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)] as [number, number, number]
  }
  const [r1, g1, b1] = parse(c1)
  const [r2, g2, b2] = parse(c2)
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${hex(r1 + (r2 - r1) * t)}${hex(g1 + (g2 - g1) * t)}${hex(b1 + (b2 - b1) * t)}`
}

/* ── Relative time ── */
export function timeAgo(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}
