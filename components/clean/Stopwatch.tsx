import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

export function CleanStopwatch() {
  const colors = useTheme()
  const [ms, setMs] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])
  const startRef = useRef<number>(0)
  const baseRef = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now()
    baseRef.current = ms
    const id = setInterval(() => {
      setMs(baseRef.current + (Date.now() - startRef.current))
    }, 50)
    return () => clearInterval(id)
  }, [running])

  useInput((ch) => {
    if (ch === ' ') setRunning(r => !r)
    if (ch === 'l' && running) setLaps(prev => [...prev, ms])
    if (ch === 'r') { setRunning(false); setMs(0); setLaps([]) }
  })

  const fmt = (t: number) => {
    const m = Math.floor(t / 60000)
    const s = Math.floor((t % 60000) / 1000)
    const cs = Math.floor((t % 1000) / 10)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>{fmt(ms)}</Text>

      {laps.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {laps.map((lap, i) => {
            const diff = i === 0 ? lap : lap - laps[i - 1]!
            return (
              <Box key={i} gap={2}>
                <Text dimColor>Lap {i + 1}</Text>
                <Text>{fmt(diff)}</Text>
              </Box>
            )
          })}
        </Box>
      )}

      <Help keys={[
        { key: 'space', label: running ? 'stop' : 'start' },
        { key: 'l', label: 'lap' },
        { key: 'r', label: 'reset' },
      ]} />
    </Box>
  )
}
