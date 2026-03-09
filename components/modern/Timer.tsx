import { useReducer, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, blendHex } from './utils'

/* ── Types ── */

interface Timer {
  id: string
  label: string
  icon: string
  duration: number
  remaining: number
  running: boolean
}

/* ── State ── */

interface State {
  timers: Timer[]
  cursor: number
}

type Action =
  | { type: 'up' }
  | { type: 'down' }
  | { type: 'toggle' }
  | { type: 'reset' }
  | { type: 'adjust'; delta: number }
  | { type: 'tick' }
  | { type: 'start_all' }
  | { type: 'stop_all' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'up': return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'down': return { ...state, cursor: Math.min(state.timers.length - 1, state.cursor + 1) }
    case 'toggle': {
      const timers = state.timers.map((t, i) => i === state.cursor ? { ...t, running: !t.running } : t)
      return { ...state, timers }
    }
    case 'reset': {
      const timers = state.timers.map((t, i) => i === state.cursor ? { ...t, remaining: t.duration, running: false } : t)
      return { ...state, timers }
    }
    case 'adjust': {
      const timers = state.timers.map((t, i) => {
        if (i !== state.cursor) return t
        const newDur = Math.max(0, t.duration + action.delta)
        return { ...t, duration: newDur, remaining: Math.min(t.remaining + action.delta, newDur) }
      })
      return { ...state, timers }
    }
    case 'tick': {
      const timers = state.timers.map(t => {
        if (!t.running || t.remaining <= 0) return { ...t, running: t.remaining > 0 && t.running }
        return { ...t, remaining: Math.max(0, t.remaining - 1) }
      })
      return { ...state, timers }
    }
    case 'start_all': return { ...state, timers: state.timers.map(t => ({ ...t, running: t.remaining > 0 })) }
    case 'stop_all': return { ...state, timers: state.timers.map(t => ({ ...t, running: false })) }
  }
}

/* ── Formatting ── */

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function renderMiniBar(pct: number, width: number, color: string): string {
  const filled = Math.round(pct * width)
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled)
}

/* ── Initial timers ── */

const INITIAL: Timer[] = [
  { id: 'pomo', label: 'Pomodoro', icon: '\u{1F345}', duration: 1500, remaining: 1500, running: false },
  { id: 'break', label: 'Break', icon: '\u2615', duration: 300, remaining: 300, running: false },
  { id: 'meet', label: 'Meeting', icon: '\u{1F4CB}', duration: 1800, remaining: 1800, running: false },
  { id: 'quick', label: 'Quick', icon: '\u26A1', duration: 60, remaining: 60, running: false },
]

/* ── Main ── */

export function ModernTimer() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, { timers: INITIAL, cursor: 0 })
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    tickRef.current = setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') dispatch({ type: 'up' })
    else if (key.downArrow || ch === 'j') dispatch({ type: 'down' })
    else if (ch === ' ') dispatch({ type: 'toggle' })
    else if (ch === 'r') dispatch({ type: 'reset' })
    else if (key.leftArrow || ch === '-') dispatch({ type: 'adjust', delta: -30 })
    else if (key.rightArrow || ch === '+') dispatch({ type: 'adjust', delta: 30 })
    else if (ch === 's') dispatch({ type: 'start_all' })
    else if (ch === 'x') dispatch({ type: 'stop_all' })
  })

  const BAR_WIDTH = 24

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>Timers</Text>
          <Box gap={1}>
            <Text dimColor>{state.timers.filter(t => t.running).length} running</Text>
          </Box>
        </Box>

        {state.timers.map((timer, i) => {
          const active = i === state.cursor
          const pct = timer.duration > 0 ? timer.remaining / timer.duration : 0
          const done = timer.remaining <= 0
          const warning = pct < 0.2 && !done
          const barColor = done ? colors.error : warning ? blendHex(colors.warning, colors.error, 1 - pct / 0.2) : blendHex(colors.info, colors.success, pct)

          return (
            <Box key={timer.id} flexDirection="column" marginBottom={i < state.timers.length - 1 ? 1 : 0}>
              <Box gap={1}>
                <Text color={active ? colors.primary : 'gray'}>{active ? '\u276F' : ' '}</Text>
                <Text>{timer.icon}</Text>
                <Text bold={active} color={active ? colors.primary : undefined}>
                  {timer.label.padEnd(10)}
                </Text>
                <Text color={timer.running ? colors.success : done ? colors.error : 'gray'}>
                  {timer.running ? '\u25CF' : done ? '\u25CB' : '\u25CB'}
                </Text>
                <Text bold color={done ? colors.error : warning ? colors.warning : undefined}>
                  {formatTime(timer.remaining)}
                </Text>
                <Text dimColor> / {formatTime(timer.duration)}</Text>
              </Box>
              <Box gap={1}>
                <Text>   </Text>
                <Text color={barColor}>{renderMiniBar(pct, BAR_WIDTH, barColor)}</Text>
                <Text color={barColor} bold>{Math.round(pct * 100).toString().padStart(3)}%</Text>
              </Box>
            </Box>
          )
        })}

        <HelpFooter keys={[
          { key: 'j/k', label: 'select' },
          { key: 'space', label: 'toggle' },
          { key: 'r', label: 'reset' },
          { key: '\u00B1 30s', label: '\u2190\u2192' },
          { key: 's/x', label: 'all' },
        ]} />
      </Card>
    </Box>
  )
}
