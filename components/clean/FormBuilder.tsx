import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { G, Help } from './utils'

type StepType = 'text' | 'select' | 'confirm'

interface Step {
  label: string
  type: StepType
  options?: string[]
  value: string
}

const STEPS: Step[] = [
  { label: 'Project name', type: 'text', value: '' },
  { label: 'Framework', type: 'select', options: ['React', 'Vue', 'Svelte', 'Angular'], value: '' },
  { label: 'Use TypeScript?', type: 'confirm', value: '' },
  { label: 'Package manager', type: 'select', options: ['npm', 'yarn', 'pnpm', 'bun'], value: '' },
]

export function CleanFormBuilder() {
  const colors = useTheme()
  const [steps, setSteps] = useState(STEPS)
  const [active, setActive] = useState(0)
  const [optCursor, setOptCursor] = useState(0)
  const [done, setDone] = useState(false)

  const step = steps[active]

  useInput((ch, key) => {
    if (done || !step) return

    if (step.type === 'text') {
      if (key.return && step.value.length > 0) {
        advance()
        return
      }
      if (key.backspace || key.delete) {
        setSteps(prev => prev.map((s, i) => i === active ? { ...s, value: s.value.slice(0, -1) } : s))
        return
      }
      if (ch && !key.ctrl && !key.meta) {
        setSteps(prev => prev.map((s, i) => i === active ? { ...s, value: s.value + ch } : s))
      }
    }

    if (step.type === 'select') {
      if (key.upArrow) setOptCursor(c => Math.max(0, c - 1))
      if (key.downArrow) setOptCursor(c => Math.min((step.options?.length ?? 1) - 1, c + 1))
      if (key.return) {
        setSteps(prev => prev.map((s, i) => i === active ? { ...s, value: s.options![optCursor]! } : s))
        setOptCursor(0)
        advance()
      }
    }

    if (step.type === 'confirm') {
      if (ch === 'y') {
        setSteps(prev => prev.map((s, i) => i === active ? { ...s, value: 'Yes' } : s))
        advance()
      }
      if (ch === 'n') {
        setSteps(prev => prev.map((s, i) => i === active ? { ...s, value: 'No' } : s))
        advance()
      }
    }
  })

  function advance() {
    if (active < steps.length - 1) setActive(a => a + 1)
    else setDone(true)
  }

  return (
    <Box flexDirection="column" padding={1}>
      {steps.map((s, i) => {
        const isDone = i < active || done
        const isActive = i === active && !done
        const isPending = i > active && !done

        return (
          <Box key={s.label} flexDirection="column">
            <Box gap={1}>
              <G s={isDone ? 'done' : isActive ? 'active' : 'pending'} />
              <Text bold={isActive} dimColor={isPending}>{s.label}</Text>
              {isDone && <Text dimColor>{s.value}</Text>}
            </Box>

            {isActive && s.type === 'text' && (
              <Box gap={1}>
                <G s="bar" />
                <Text color={colors.primary}>{'> '}</Text>
                <Text>{s.value}</Text>
                <Text color={colors.primary}>{'\u2588'}</Text>
              </Box>
            )}

            {isActive && s.type === 'select' && s.options && (
              <Box flexDirection="column">
                {s.options.map((opt, oi) => (
                  <Box key={opt} gap={1}>
                    <G s="bar" />
                    <Text color={oi === optCursor ? colors.primary : undefined}>
                      {oi === optCursor ? '\u25B8' : ' '}
                    </Text>
                    <Text bold={oi === optCursor}>{opt}</Text>
                  </Box>
                ))}
              </Box>
            )}

            {isActive && s.type === 'confirm' && (
              <Box gap={1}>
                <G s="bar" />
                <Text dimColor>y / n</Text>
              </Box>
            )}

            {i < steps.length - 1 && !isPending && (
              <Box><G s="bar" /></Box>
            )}
          </Box>
        )
      })}

      {done && <Box marginTop={1}><Text dimColor>Setup complete.</Text></Box>}
    </Box>
  )
}
