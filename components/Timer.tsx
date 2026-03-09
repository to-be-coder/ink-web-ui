import { useReducer, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// --- Types (matching bubbles/timer) ---

interface TimerEntry {
  label: string
  totalSeconds: number
  remainingSeconds: number
  running: boolean
  timedOut: boolean
}

interface State {
  timers: TimerEntry[]
  activeTimer: number
}

type Action =
  | { type: 'tick' }
  | { type: 'toggle' }
  | { type: 'reset' }
  | { type: 'next_timer' }
  | { type: 'prev_timer' }
  | { type: 'adjust'; delta: number }
  | { type: 'start_all' }
  | { type: 'stop_all' }

function reducer(state: State, action: Action): State {
  const { timers, activeTimer } = state
  const timer = timers[activeTimer]

  function withTimer(fn: (t: TimerEntry) => TimerEntry): State {
    const next = [...timers]
    next[activeTimer] = fn({ ...timer })
    return { ...state, timers: next }
  }

  switch (action.type) {
    case 'tick': {
      const next = timers.map((t) => {
        if (!t.running || t.timedOut) return t
        const remaining = t.remainingSeconds - 1
        if (remaining <= 0) {
          return { ...t, remainingSeconds: 0, running: false, timedOut: true }
        }
        return { ...t, remainingSeconds: remaining }
      })
      return { ...state, timers: next }
    }
    case 'toggle':
      return withTimer((t) => {
        if (t.timedOut) return t
        t.running = !t.running
        return t
      })
    case 'reset':
      return withTimer((t) => ({
        ...t,
        remainingSeconds: t.totalSeconds,
        running: false,
        timedOut: false,
      }))
    case 'next_timer':
      return { ...state, activeTimer: Math.min(timers.length - 1, activeTimer + 1) }
    case 'prev_timer':
      return { ...state, activeTimer: Math.max(0, activeTimer - 1) }
    case 'adjust':
      return withTimer((t) => {
        if (t.running) return t
        const newTotal = Math.max(5, t.totalSeconds + action.delta)
        return { ...t, totalSeconds: newTotal, remainingSeconds: newTotal, timedOut: false }
      })
    case 'start_all': {
      const next = timers.map((t) => t.timedOut ? t : { ...t, running: true })
      return { ...state, timers: next }
    }
    case 'stop_all': {
      const next = timers.map((t) => ({ ...t, running: false }))
      return { ...state, timers: next }
    }
  }
}

// --- Helpers ---

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function progressBar(remaining: number, total: number, width: number, colors: ReturnType<typeof useTheme>): { filled: string; empty: string; color: string } {
  const progress = total > 0 ? 1 - remaining / total : 0
  const filledCount = Math.round(progress * width)
  const emptyCount = width - filledCount

  let color = colors.info
  if (progress > 0.75) color = colors.warning
  if (progress > 0.9) color = colors.error

  return {
    filled: '█'.repeat(filledCount),
    empty: '░'.repeat(emptyCount),
    color,
  }
}

// --- Initial timers ---

const INITIAL_TIMERS: TimerEntry[] = [
  { label: 'Pomodoro', totalSeconds: 25 * 60, remainingSeconds: 25 * 60, running: false, timedOut: false },
  { label: 'Break', totalSeconds: 5 * 60, remainingSeconds: 5 * 60, running: false, timedOut: false },
  { label: 'Meeting', totalSeconds: 30 * 60, remainingSeconds: 30 * 60, running: false, timedOut: false },
  { label: 'Quick', totalSeconds: 60, remainingSeconds: 60, running: false, timedOut: false },
]

const BAR_WIDTH = 30

// --- Component ---

export function Timer() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    timers: INITIAL_TIMERS.map((t) => ({ ...t })),
    activeTimer: 0,
  })

  const { timers, activeTimer } = state
  const anyRunning = timers.some((t) => t.running)

  // Tick interval
  useEffect(() => {
    if (!anyRunning) return
    const interval = setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => clearInterval(interval)
  }, [anyRunning])

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') dispatch({ type: 'prev_timer' })
    else if (key.downArrow || ch === 'j') dispatch({ type: 'next_timer' })
    else if (ch === ' ') dispatch({ type: 'toggle' })
    else if (ch === 'r') dispatch({ type: 'reset' })
    else if (key.rightArrow || ch === '+') dispatch({ type: 'adjust', delta: 30 })
    else if (key.leftArrow || ch === '-') dispatch({ type: 'adjust', delta: -30 })
    else if (ch === 's') dispatch({ type: 'start_all' })
    else if (ch === 'x') dispatch({ type: 'stop_all' })
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Timer</Text>
        <Text dimColor>{timers.length} timers</Text>
        {anyRunning && <Text color={colors.success}>running</Text>}
      </Box>

      {timers.map((timer, i) => {
        const isActive = i === activeTimer
        const bar = progressBar(timer.remainingSeconds, timer.totalSeconds, BAR_WIDTH, colors)

        return (
          <Box key={timer.label} flexDirection="column" marginBottom={1}>
            <Box gap={1}>
              <Text color={isActive ? colors.primary : 'gray'}>
                {isActive ? '▸' : ' '}
              </Text>
              <Box width={10}>
                <Text
                  color={timer.timedOut ? colors.error : isActive ? 'white' : undefined}
                  bold={isActive}
                >
                  {timer.label}
                </Text>
              </Box>
              <Box width={8}>
                <Text
                  color={
                    timer.timedOut
                      ? colors.error
                      : timer.running
                        ? colors.success
                        : undefined
                  }
                  bold
                >
                  {formatTime(timer.remainingSeconds)}
                </Text>
              </Box>
              <Text dimColor>
                {timer.timedOut
                  ? ' done'
                  : timer.running
                    ? ' ●'
                    : ' ○'}
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text color={bar.color}>{bar.filled}</Text>
              <Text color="#333333">{bar.empty}</Text>
              <Text dimColor>
                {' '}
                {Math.round(
                  (1 - timer.remainingSeconds / timer.totalSeconds) * 100,
                )}
                %
              </Text>
            </Box>
          </Box>
        )
      })}

      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> ↑↓ </Text><Text dimColor> select</Text></Box>
        <Box><Text inverse bold> space </Text><Text dimColor> toggle</Text></Box>
        <Box><Text inverse bold> r </Text><Text dimColor> reset</Text></Box>
        <Box><Text inverse bold> ←→ </Text><Text dimColor> ±30s</Text></Box>
      </Box>
    </Box>
  )
}
