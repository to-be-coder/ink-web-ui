import { Box, Text } from 'ink-web'
import { useTheme } from '../theme'

/* ── Guide bar symbol ── */

const SYMS = { active: '\u25C6', done: '\u25C7', pending: '\u25CB', error: '\u25B2', bar: '\u2502' }

export function G({ s, color }: { s: keyof typeof SYMS; color?: string }) {
  const colors = useTheme()
  const defaults: Record<string, string> = {
    active: colors.primary, done: 'gray', pending: 'gray', error: colors.error, bar: 'gray',
  }
  return <Text color={color ?? defaults[s]}>{SYMS[s]}</Text>
}

/* ── Help hint (single dim line) ── */

export function Help({ keys }: { keys: { key: string; label: string }[] }) {
  const parts = keys.map(k => `${k.key} ${k.label}`).join('  ')
  return <Box marginTop={1}><Text dimColor>{parts}</Text></Box>
}

/* ── Spinner frames ── */

export const SPIN = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F']
