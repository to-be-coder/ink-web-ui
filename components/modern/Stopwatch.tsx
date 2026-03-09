import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Separator } from './utils'

/* ── Big digit rendering ── */

const DIGITS: Record<string, string[]> = {
  '0': ['\u2588\u2588\u2588', '\u2588 \u2588', '\u2588 \u2588', '\u2588 \u2588', '\u2588\u2588\u2588'],
  '1': ['  \u2588', '  \u2588', '  \u2588', '  \u2588', '  \u2588'],
  '2': ['\u2588\u2588\u2588', '  \u2588', '\u2588\u2588\u2588', '\u2588  ', '\u2588\u2588\u2588'],
  '3': ['\u2588\u2588\u2588', '  \u2588', '\u2588\u2588\u2588', '  \u2588', '\u2588\u2588\u2588'],
  '4': ['\u2588 \u2588', '\u2588 \u2588', '\u2588\u2588\u2588', '  \u2588', '  \u2588'],
  '5': ['\u2588\u2588\u2588', '\u2588  ', '\u2588\u2588\u2588', '  \u2588', '\u2588\u2588\u2588'],
  '6': ['\u2588\u2588\u2588', '\u2588  ', '\u2588\u2588\u2588', '\u2588 \u2588', '\u2588\u2588\u2588'],
  '7': ['\u2588\u2588\u2588', '  \u2588', '  \u2588', '  \u2588', '  \u2588'],
  '8': ['\u2588\u2588\u2588', '\u2588 \u2588', '\u2588\u2588\u2588', '\u2588 \u2588', '\u2588\u2588\u2588'],
  '9': ['\u2588\u2588\u2588', '\u2588 \u2588', '\u2588\u2588\u2588', '  \u2588', '\u2588\u2588\u2588'],
  ':': [' ', '\u25CF', ' ', '\u25CF', ' '],
  '.': [' ', ' ', ' ', ' ', '\u25CF'],
}

function BigTime({ time, color }: { time: string; color: string }) {
  const rows: string[][] = [[], [], [], [], []]
  for (const ch of time) {
    const d = DIGITS[ch] ?? DIGITS['0']!
    for (let r = 0; r < 5; r++) rows[r]!.push(d![r]!)
  }
  return (
    <Box flexDirection="column" alignItems="center">
      {rows.map((row, i) => (
        <Text key={i} color={color}>{row.join(' ')}</Text>
      ))}
    </Box>
  )
}

/* ── Lap formatting ── */

interface Lap {
  number: number
  split: number
  total: number
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const cs = Math.floor((ms % 1000) / 10)
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}

function formatBigTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const cs = Math.floor((ms % 1000) / 10)
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}

/* ── Main ── */

export function ModernStopwatch() {
  const colors = useTheme()
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState<Lap[]>([])
  const startTimeRef = useRef(0)
  const elapsedRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    startTimeRef.current = performance.now() - elapsedRef.current
    function tick() {
      const now = performance.now()
      const ms = now - startTimeRef.current
      elapsedRef.current = ms
      setElapsed(ms)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [running])

  useInput((ch) => {
    if (ch === ' ') {
      setRunning(r => !r)
    }
    if (ch === 'l' && running) {
      const lastTotal = laps.length > 0 ? laps[laps.length - 1]!.total : 0
      setLaps(prev => [...prev, {
        number: prev.length + 1,
        split: elapsedRef.current - lastTotal,
        total: elapsedRef.current,
      }])
    }
    if (ch === 'r' && !running) {
      setElapsed(0)
      elapsedRef.current = 0
      setLaps([])
    }
  })

  const timeStr = formatBigTime(elapsed)
  const status = running ? 'Running' : elapsed > 0 ? 'Paused' : 'Ready'
  const statusColor = running ? colors.success : elapsed > 0 ? colors.warning : 'gray'

  // Find best/worst lap splits
  const splits = laps.map(l => l.split)
  const bestSplit = splits.length > 1 ? Math.min(...splits) : -1
  const worstSplit = splits.length > 1 ? Math.max(...splits) : -1

  const visibleLaps = laps.slice(-6)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>Stopwatch</Text>
          <Box gap={1}>
            <Text color={statusColor}>{'\u25CF'}</Text>
            <Text color={statusColor}>{status}</Text>
          </Box>
        </Box>

        {/* Big time display */}
        <Box justifyContent="center" marginBottom={1}>
          <BigTime time={timeStr} color={running ? colors.primary : elapsed > 0 ? colors.warning : 'gray'} />
        </Box>

        {/* Laps */}
        {laps.length > 0 && (
          <>
            <Separator label={`Laps (${laps.length})`} />
            <Box flexDirection="column" marginTop={1}>
              <Box>
                <Text dimColor>{'  #   Split        Total'}</Text>
              </Box>
              {visibleLaps.map(lap => {
                const isBest = lap.split === bestSplit
                const isWorst = lap.split === worstSplit
                const splitColor = isBest ? colors.success : isWorst ? colors.error : undefined

                return (
                  <Box key={lap.number} gap={1}>
                    <Text dimColor>{lap.number.toString().padStart(3)}</Text>
                    <Text bold={isBest || isWorst} color={splitColor}>
                      {formatMs(lap.split).padStart(11)}
                    </Text>
                    <Text dimColor>{formatMs(lap.total).padStart(11)}</Text>
                    {isBest && <Text color={colors.success}> best</Text>}
                    {isWorst && <Text color={colors.error}> worst</Text>}
                  </Box>
                )
              })}
              {laps.length > 6 && <Text dimColor>  ... {laps.length - 6} earlier laps</Text>}
            </Box>
          </>
        )}

        <HelpFooter keys={[
          { key: 'space', label: running ? 'stop' : 'start' },
          ...(running ? [{ key: 'l', label: 'lap' }] : []),
          ...(!running && elapsed > 0 ? [{ key: 'r', label: 'reset' }] : []),
        ]} />
      </Card>
    </Box>
  )
}
