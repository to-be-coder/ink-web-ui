import { useState, useEffect, useRef, useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

const PACKAGES = [
  'react@19.0.0',
  'typescript@5.7.2',
  'vite@6.1.0',
  '@types/node@22.10.0',
  'eslint@9.17.0',
  'prettier@3.4.2',
  'vitest@3.0.1',
  'tailwindcss@4.0.5',
  'zustand@5.0.3',
  '@tanstack/react-query@5.62.0',
]

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

interface State {
  status: 'idle' | 'installing' | 'done'
  currentIndex: number
  installedCount: number
  spinnerFrame: number
}

type Action =
  | { type: 'start' }
  | { type: 'package_installed' }
  | { type: 'tick_spinner' }
  | { type: 'reset' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { ...state, status: 'installing', currentIndex: 0, installedCount: 0, spinnerFrame: 0 }
    case 'package_installed': {
      const newCount = state.installedCount + 1
      if (newCount >= PACKAGES.length) {
        return { ...state, status: 'done', installedCount: newCount }
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        installedCount: newCount,
      }
    }
    case 'tick_spinner':
      return { ...state, spinnerFrame: (state.spinnerFrame + 1) % SPINNER_FRAMES.length }
    case 'reset':
      return { status: 'idle', currentIndex: 0, installedCount: 0, spinnerFrame: 0 }
  }
}

export function PackageManager() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    status: 'idle',
    currentIndex: 0,
    installedCount: 0,
    spinnerFrame: 0,
  })

  const statusRef = useRef(state.status)
  statusRef.current = state.status
  const currentRef = useRef(state.currentIndex)
  currentRef.current = state.currentIndex
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useInput((ch) => {
    if (ch === ' ' && state.status === 'idle') dispatch({ type: 'start' })
    else if (ch === 'r') {
      if (timerRef.current) clearTimeout(timerRef.current)
      dispatch({ type: 'reset' })
    }
  })

  // Spinner tick
  useEffect(() => {
    if (state.status !== 'installing') return
    const timer = setInterval(() => dispatch({ type: 'tick_spinner' }), 80)
    return () => clearInterval(timer)
  }, [state.status])

  // Install simulation
  useEffect(() => {
    if (state.status !== 'installing') return
    if (state.installedCount >= PACKAGES.length) return

    const delay = 100 + Math.random() * 400
    timerRef.current = setTimeout(() => {
      if (statusRef.current === 'installing') {
        dispatch({ type: 'package_installed' })
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state.status, state.installedCount])

  const { status, currentIndex, installedCount, spinnerFrame } = state
  const progressWidth = 30
  const filled = Math.round((installedCount / PACKAGES.length) * progressWidth)
  const progressBar = '█'.repeat(filled) + '░'.repeat(progressWidth - filled)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>PackageManager</Text>
        <Text dimColor>
          {status === 'idle' ? 'ready' : status === 'done' ? 'complete' : `${installedCount}/${PACKAGES.length}`}
        </Text>
      </Box>

      {/* Installed packages */}
      {PACKAGES.slice(0, installedCount).map((pkg) => (
        <Box key={pkg} gap={1}>
          <Text color={colors.success}>✓</Text>
          <Text>{pkg}</Text>
        </Box>
      ))}

      {/* Currently installing */}
      {status === 'installing' && currentIndex < PACKAGES.length && (
        <Box gap={1}>
          <Text color={colors.info}>{SPINNER_FRAMES[spinnerFrame]}</Text>
          <Text color={colors.primary}>{PACKAGES[currentIndex]}</Text>
        </Box>
      )}

      {/* Progress bar */}
      {status !== 'idle' && (
        <Box marginTop={1} gap={1}>
          <Text color={colors.info}>{progressBar}</Text>
          <Text dimColor>{installedCount}/{PACKAGES.length}</Text>
        </Box>
      )}

      {/* Done message */}
      {status === 'done' && (
        <Box marginTop={1}>
          <Text color={colors.success} bold>
            Done! Installed {PACKAGES.length} packages.
          </Text>
        </Box>
      )}

      {/* Idle message */}
      {status === 'idle' && (
        <Box marginTop={1}>
          <Text dimColor>{PACKAGES.length} packages to install</Text>
        </Box>
      )}

      {/* Help bar */}
      <Box marginTop={1} gap={2}>
        {status === 'idle' && (
          <Box>
            <Text inverse bold> space </Text>
            <Text dimColor> start</Text>
          </Box>
        )}
        <Box>
          <Text inverse bold> r </Text>
          <Text dimColor> reset</Text>
        </Box>
      </Box>
    </Box>
  )
}
