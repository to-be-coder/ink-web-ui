import { Box, Text } from 'ink-web'
import { useTheme } from '../theme'

/* ── Spinner frames ── */

export const SPIN = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F']

/* ── Badge (inverse pill) ── */

export function Badge({ label, color }: { label: string; color?: string }) {
  const colors = useTheme()
  return <Text inverse bold color={color ?? colors.primary}> {label} </Text>
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

export function Sep({ label, color }: { label?: string; color?: string } = {}) {
  if (label) {
    return (
      <Box>
        <Text dimColor color={color}>{'\u2500\u2500 '}{label}{' '}{'\u2500'.repeat(80)}</Text>
      </Box>
    )
  }
  return <Text dimColor color={color} wrap="truncate-end">{'\u2500'.repeat(200)}</Text>
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
