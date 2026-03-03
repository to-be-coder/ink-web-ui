import { useReducer, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

type Phase = 'work' | 'break'
type Status = 'idle' | 'running' | 'paused'

interface State {
  phase: Phase
  status: Status
  secondsLeft: number
  sessions: number
  goalSessions: number
  workMinutes: number
  breakMinutes: number
}

type Action =
  | { type: 'tick' }
  | { type: 'toggle' }
  | { type: 'reset' }
  | { type: 'skip' }
  | { type: 'adjust_work'; delta: number }
  | { type: 'adjust_break'; delta: number }
  | { type: 'adjust_goal'; delta: number }

function nextPhase(state: State): State {
  if (state.phase === 'work') {
    const newSessions = state.sessions + 1
    if (newSessions >= state.goalSessions) {
      return {
        ...state,
        phase: 'work',
        status: 'idle',
        secondsLeft: state.workMinutes * 60,
        sessions: newSessions,
      }
    }
    return {
      ...state,
      phase: 'break',
      status: 'running',
      secondsLeft: state.breakMinutes * 60,
      sessions: newSessions,
    }
  }
  return {
    ...state,
    phase: 'work',
    status: 'running',
    secondsLeft: state.workMinutes * 60,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tick': {
      if (state.status !== 'running') return state
      if (state.secondsLeft <= 1) return nextPhase(state)
      return { ...state, secondsLeft: state.secondsLeft - 1 }
    }
    case 'toggle': {
      if (state.sessions >= state.goalSessions) return state
      if (state.status === 'idle') return { ...state, status: 'running' }
      if (state.status === 'running') return { ...state, status: 'paused' }
      return { ...state, status: 'running' }
    }
    case 'reset':
      return {
        ...state,
        status: 'idle',
        phase: 'work',
        secondsLeft: state.workMinutes * 60,
        sessions: 0,
      }
    case 'skip':
      return nextPhase(state)
    case 'adjust_work': {
      if (state.status !== 'idle') return state
      const mins = Math.max(1, Math.min(60, state.workMinutes + action.delta))
      return {
        ...state,
        workMinutes: mins,
        secondsLeft: state.phase === 'work' ? mins * 60 : state.secondsLeft,
      }
    }
    case 'adjust_break': {
      if (state.status !== 'idle') return state
      const mins = Math.max(1, Math.min(30, state.breakMinutes + action.delta))
      return {
        ...state,
        breakMinutes: mins,
        secondsLeft: state.phase === 'break' ? mins * 60 : state.secondsLeft,
      }
    }
    case 'adjust_goal': {
      if (state.status !== 'idle') return state
      return {
        ...state,
        goalSessions: Math.max(1, Math.min(12, state.goalSessions + action.delta)),
      }
    }
  }
}

const INITIAL: State = {
  phase: 'work',
  status: 'idle',
  secondsLeft: 25 * 60,
  sessions: 0,
  goalSessions: 4,
  workMinutes: 25,
  breakMinutes: 5,
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function TimerBar({ secondsLeft, totalSeconds, width = 30 }: { secondsLeft: number; totalSeconds: number; width?: number }) {
  const colors = useTheme()
  const progress = 1 - secondsLeft / totalSeconds
  const filled = Math.round(progress * width)
  const empty = width - filled
  return (
    <Text>
      <Text color={colors.primary}>{'█'.repeat(filled)}</Text>
      <Text color="gray">{'░'.repeat(empty)}</Text>
    </Text>
  )
}

function SessionDots({ current, goal }: { current: number; goal: number }) {
  const colors = useTheme()
  const dots = Array.from({ length: goal }, (_, i) =>
    i < current ? '●' : '○'
  ).join(' ')
  return (
    <Box>
      <Text color={colors.warning}>{dots}</Text>
    </Box>
  )
}

export function PomodoroTimer() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const { phase, status, secondsLeft, sessions, goalSessions, workMinutes, breakMinutes } = state

  const done = sessions >= goalSessions

  useEffect(() => {
    if (status !== 'running') return
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => clearInterval(timer)
  }, [status])

  useInput((ch, key) => {
    if (ch === ' ') dispatch({ type: 'toggle' })
    else if (ch === 'r') dispatch({ type: 'reset' })
    else if (ch === 's') dispatch({ type: 'skip' })
    else if (key.upArrow) dispatch({ type: 'adjust_work', delta: 1 })
    else if (key.downArrow) dispatch({ type: 'adjust_work', delta: -1 })
    else if (ch === '+') dispatch({ type: 'adjust_break', delta: 1 })
    else if (ch === '-') dispatch({ type: 'adjust_break', delta: -1 })
    else if (ch === ']') dispatch({ type: 'adjust_goal', delta: 1 })
    else if (ch === '[') dispatch({ type: 'adjust_goal', delta: -1 })
  })

  const totalSeconds = phase === 'work' ? workMinutes * 60 : breakMinutes * 60
  const phaseColor = phase === 'work' ? colors.error : colors.success
  const phaseLabel = phase === 'work' ? 'WORK' : 'BREAK'

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Pomodoro</Text>
        {done
          ? <Text color={colors.success} bold>Complete!</Text>
          : <Text dimColor>{status === 'idle' ? 'Ready' : status === 'paused' ? 'Paused' : 'Running'}</Text>
        }
      </Box>

      {!done && (
        <Box flexDirection="column">
          <Box gap={2}>
            <Text color={phaseColor} bold>{phaseLabel}</Text>
            <Text bold>{formatTime(secondsLeft)}</Text>
          </Box>
          <TimerBar secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <SessionDots current={sessions} goal={goalSessions} />
        <Text dimColor>{sessions} of {goalSessions} done</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Work     {workMinutes} min</Text>
        <Text dimColor>Break    {breakMinutes} min</Text>
        <Text dimColor>Goal     {goalSessions} sessions</Text>
      </Box>

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> space </Text>
          <Text dimColor> {status === 'running' ? 'pause' : 'start'}</Text>
        </Box>
        <Box>
          <Text inverse bold> r </Text>
          <Text dimColor> reset</Text>
        </Box>
        <Box>
          <Text inverse bold> s </Text>
          <Text dimColor> skip</Text>
        </Box>
      </Box>
      {status === 'idle' && (
        <Box marginTop={0} gap={2}>
          <Box>
            <Text inverse bold> ↑↓ </Text>
            <Text dimColor> work</Text>
          </Box>
          <Box>
            <Text inverse bold> +- </Text>
            <Text dimColor> break</Text>
          </Box>
          <Box>
            <Text inverse bold> [] </Text>
            <Text dimColor> goal</Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}
