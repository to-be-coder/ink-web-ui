import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

export function CleanTimer() {
  const colors = useTheme()
  const [total, setTotal] = useState(300)
  const [remaining, setRemaining] = useState(300)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000)
    intervalRef.current = id
    return () => clearInterval(id)
  }, [running, remaining <= 0])

  useEffect(() => {
    if (remaining <= 0 && running) setRunning(false)
  }, [remaining])

  useInput((ch, key) => {
    if (ch === ' ') setRunning(r => !r)
    if (ch === 'r') { setRemaining(total); setRunning(false) }
    if (key.leftArrow && !running) {
      const n = Math.max(60, total - 60)
      setTotal(n); setRemaining(n)
    }
    if (key.rightArrow && !running) {
      const n = Math.min(3600, total + 60)
      setTotal(n); setRemaining(n)
    }
  })

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60
  const pct = total > 0 ? remaining / total : 0
  const w = 30
  const filled = Math.round(pct * w)
  const isLow = pct < 0.2 && pct > 0

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={isLow ? colors.error : remaining <= 0 ? colors.success : undefined}>
        {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
      </Text>

      <Box marginTop={1}>
        <Text color={isLow ? colors.error : colors.primary}>{'\u2588'.repeat(filled)}</Text>
        <Text dimColor>{'\u2591'.repeat(w - filled)}</Text>
      </Box>

      {remaining <= 0 && <Box marginTop={1}><Text dimColor>Time's up.</Text></Box>}

      <Help keys={[
        { key: 'space', label: running ? 'pause' : 'start' },
        { key: '\u2190\u2192', label: '\u00B11m' },
        { key: 'r', label: 'reset' },
      ]} />
    </Box>
  )
}
