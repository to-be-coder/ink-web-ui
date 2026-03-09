import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

interface Bar {
  label: string
  value: number
  target: number
}

const BARS: Bar[] = [
  { label: 'Downloading', value: 0, target: 100 },
  { label: 'Installing', value: 0, target: 100 },
  { label: 'Building', value: 0, target: 100 },
]

export function CleanProgress() {
  const colors = useTheme()
  const [bars, setBars] = useState(BARS)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    setBars(BARS)
    const id = setInterval(() => {
      setBars(prev => {
        const next = prev.map((bar, i) => {
          const prevDone = i === 0 || prev[i - 1]!.value >= 100
          if (!prevDone || bar.value >= 100) return bar
          return { ...bar, value: Math.min(100, bar.value + Math.random() * 8 + 2) }
        })
        return next
      })
    }, 200)
    return () => clearInterval(id)
  }, [runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  const w = 30
  const allDone = bars.every(b => b.value >= 100)

  return (
    <Box flexDirection="column" padding={1}>
      {bars.map(bar => {
        const pct = Math.round(bar.value)
        const filled = Math.round((bar.value / 100) * w)
        return (
          <Box key={bar.label} gap={1} marginBottom={0}>
            <Text dimColor={pct >= 100}>{bar.label.padEnd(14)}</Text>
            <Text color={pct >= 100 ? colors.success : colors.primary}>
              {'\u2588'.repeat(filled)}
            </Text>
            <Text dimColor>{'\u2591'.repeat(w - filled)}</Text>
            <Text dimColor={pct >= 100}>{String(pct).padStart(3)}%</Text>
          </Box>
        )
      })}

      {allDone && (
        <Box marginTop={1}><Text dimColor>All tasks complete.</Text></Box>
      )}

      <Help keys={[{ key: 'r', label: 'restart' }]} />
    </Box>
  )
}
