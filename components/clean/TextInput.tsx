import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { G, Help } from './utils'

interface Field {
  label: string
  value: string
  placeholder: string
  password?: boolean
}

const FIELDS: Field[] = [
  { label: 'Project name', value: '', placeholder: 'my-app' },
  { label: 'Author', value: '', placeholder: 'your name' },
  { label: 'Password', value: '', placeholder: '', password: true },
  { label: 'Description', value: '', placeholder: 'A cool project' },
]

export function CleanTextInput() {
  const colors = useTheme()
  const [fields, setFields] = useState(FIELDS)
  const [active, setActive] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  useInput((ch, key) => {
    if (submitted) return

    if (key.return) {
      if (active < fields.length - 1) setActive(a => a + 1)
      else setSubmitted(true)
      return
    }

    if (key.backspace || key.delete) {
      setFields(prev => prev.map((f, i) => i === active ? { ...f, value: f.value.slice(0, -1) } : f))
      return
    }

    if (ch && !key.ctrl && !key.meta) {
      setFields(prev => prev.map((f, i) => i === active ? { ...f, value: f.value + ch } : f))
    }
  })

  return (
    <Box flexDirection="column" padding={1}>
      {fields.map((field, i) => {
        const isDone = i < active || submitted
        const isActive = i === active && !submitted
        const isPending = i > active && !submitted

        return (
          <Box key={field.label} flexDirection="column">
            <Box gap={1}>
              <G s={isDone ? 'done' : isActive ? 'active' : 'pending'} />
              <Text bold={isActive} dimColor={isPending}>{field.label}</Text>
              {isDone && (
                <Text dimColor>
                  {field.password ? '\u2022'.repeat(field.value.length || 3) : (field.value || field.placeholder)}
                </Text>
              )}
            </Box>

            {isActive && (
              <Box gap={1}>
                <G s="bar" />
                <Text color={colors.primary}>{'> '}</Text>
                <Text>
                  {field.password ? '\u2022'.repeat(field.value.length) : field.value}
                </Text>
                {field.value.length === 0 && <Text dimColor>{field.placeholder}</Text>}
                <Text color={colors.primary}>{'\u2588'}</Text>
              </Box>
            )}

            {!isPending && i < fields.length - 1 && (
              <Box><G s="bar" /></Box>
            )}
          </Box>
        )
      })}

      {submitted && (
        <Box marginTop={1}><Text dimColor>Submitted.</Text></Box>
      )}

      <Help keys={submitted ? [] : [{ key: 'enter', label: 'next' }]} />
    </Box>
  )
}
