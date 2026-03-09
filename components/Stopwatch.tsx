import { useReducer, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// --- Types (matching bubbles/stopwatch) ---

interface Lap {
  number: number
  elapsed: number // ms at lap time
  split: number // ms since last lap
}

interface State {
  elapsedMs: number
  running: boolean
  laps: Lap[]
  lastLapMs: number
}

type Action =
  | { type: 'tick'; delta: number }
  | { type: 'toggle' }
  | { type: 'reset' }
  | { type: 'lap' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tick':
      if (!state.running) return state
      return { ...state, elapsedMs: state.elapsedMs + action.delta }
    case 'toggle':
      return { ...state, running: !state.running }
    case 'reset':
      return { elapsedMs: 0, running: false, laps: [], lastLapMs: 0 }
    case 'lap': {
      if (!state.running || state.elapsedMs === 0) return state
      const split = state.elapsedMs - state.lastLapMs
      const lap: Lap = {
        number: state.laps.length + 1,
        elapsed: state.elapsedMs,
        split,
      }
      return { ...state, laps: [lap, ...state.laps], lastLapMs: state.elapsedMs }
    }
  }
}

// --- Helpers ---

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const centiseconds = Math.floor((ms % 1000) / 10)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return formatMs(ms)
}

// Large digit display using block characters
const DIGITS: Record<string, string[]> = {
  '0': ['█▀█', '█ █', '█▄█'],
  '1': [' ▀█', '  █', '  █'],
  '2': ['█▀█', ' ▄█', '█▄▄'],
  '3': ['█▀█', ' ▄█', '█▄█'],
  '4': ['█ █', '█▄█', '  █'],
  '5': ['█▀▀', '█▄█', '▄▄█'],
  '6': ['█▀▀', '█▄█', '█▄█'],
  '7': ['█▀█', '  █', '  █'],
  '8': ['█▀█', '█▄█', '█▄█'],
  '9': ['█▀█', '█▄█', '▄▄█'],
  ':': [' ', '·', ' '],
  '.': [' ', ' ', '·'],
}

const LAP_VIEWPORT = 6

// --- Component ---

export function Stopwatch() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    elapsedMs: 0,
    running: false,
    laps: [],
    lastLapMs: 0,
  })

  const { elapsedMs, running, laps } = state

  // High-frequency tick when running
  useEffect(() => {
    if (!running) return
    let last = performance.now()
    let raf: number

    const loop = () => {
      const now = performance.now()
      const delta = now - last
      last = now
      dispatch({ type: 'tick', delta })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running])

  useInput((ch) => {
    if (ch === ' ') dispatch({ type: 'toggle' })
    else if (ch === 'r') dispatch({ type: 'reset' })
    else if (ch === 'l') dispatch({ type: 'lap' })
  })

  // Format time for large display
  const timeStr = formatMs(elapsedMs)
  // Only show MM:SS.CC portion for large display
  const displayChars = timeStr.slice(-8) // "MM:SS.CC"

  // Find best/worst laps
  let bestLapIdx = -1
  let worstLapIdx = -1
  if (laps.length > 1) {
    let bestSplit = Infinity
    let worstSplit = 0
    laps.forEach((lap, i) => {
      if (lap.split < bestSplit) { bestSplit = lap.split; bestLapIdx = i }
      if (lap.split > worstSplit) { worstSplit = lap.split; worstLapIdx = i }
    })
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Stopwatch</Text>
        <Text dimColor>
          {running ? 'running' : elapsedMs > 0 ? 'paused' : 'ready'}
        </Text>
      </Box>

      {/* Large time display */}
      <Box flexDirection="column" marginBottom={1}>
        {[0, 1, 2].map((row) => (
          <Box key={row} gap={0}>
            <Text> </Text>
            {displayChars.split('').map((ch, ci) => {
              const glyph = DIGITS[ch]
              if (!glyph) return <Text key={ci}>{ch}</Text>
              return (
                <Text key={ci} color={running ? colors.primary : colors.info}>
                  {glyph[row]}
                  {ch !== '.' && ch !== ':' ? ' ' : ''}
                </Text>
              )
            })}
          </Box>
        ))}
      </Box>

      {/* Precise time */}
      <Box marginBottom={1}>
        <Text dimColor>Elapsed: </Text>
        <Text bold>{timeStr}</Text>
      </Box>

      {/* Laps */}
      {laps.length > 0 && (
        <Box flexDirection="column">
          <Box>
            <Box width={6}><Text bold dimColor>Lap</Text></Box>
            <Box width={14}><Text bold dimColor>Split</Text></Box>
            <Box width={14}><Text bold dimColor>Total</Text></Box>
          </Box>
          <Box><Text dimColor>{'─'.repeat(34)}</Text></Box>
          {laps.slice(0, LAP_VIEWPORT).map((lap, i) => {
            let lapColor: string | undefined
            if (i === bestLapIdx) lapColor = colors.success
            else if (i === worstLapIdx) lapColor = colors.error

            return (
              <Box key={lap.number}>
                <Box width={6}>
                  <Text dimColor>#{lap.number}</Text>
                </Box>
                <Box width={14}>
                  <Text color={lapColor}>{formatDuration(lap.split)}</Text>
                </Box>
                <Box width={14}>
                  <Text dimColor>{formatMs(lap.elapsed)}</Text>
                </Box>
              </Box>
            )
          })}
          {laps.length > LAP_VIEWPORT && (
            <Text dimColor>  +{laps.length - LAP_VIEWPORT} more</Text>
          )}
        </Box>
      )}

      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> space </Text><Text dimColor> {running ? 'stop' : 'start'}</Text></Box>
        <Box><Text inverse bold> l </Text><Text dimColor> lap</Text></Box>
        <Box><Text inverse bold> r </Text><Text dimColor> reset</Text></Box>
      </Box>
    </Box>
  )
}
