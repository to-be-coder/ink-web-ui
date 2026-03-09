import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// --- Spinner types (matching Charm's bubbles/spinner) ---

interface SpinnerType {
  name: string
  frames: string[]
  interval: number
}

const SPINNERS: SpinnerType[] = [
  { name: 'Line', frames: ['|', '/', '-', '\\'], interval: 100 },
  { name: 'Dot', frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'], interval: 100 },
  { name: 'MiniDot', frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'], interval: 83 },
  { name: 'Jump', frames: ['⢄', '⢂', '⢁', '⡁', '⡈', '⡐', '⡠'], interval: 100 },
  { name: 'Pulse', frames: ['█', '▓', '▒', '░'], interval: 125 },
  { name: 'Points', frames: ['∙∙∙', '●∙∙', '∙●∙', '∙∙●'], interval: 143 },
  { name: 'Globe', frames: ['🌍', '🌎', '🌏'], interval: 250 },
  { name: 'Moon', frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'], interval: 125 },
  { name: 'Meter', frames: ['▱▱▱', '▰▱▱', '▰▰▱', '▰▰▰', '▰▰▱', '▰▱▱', '▱▱▱'], interval: 143 },
  { name: 'Hamburger', frames: ['☱', '☲', '☴', '☲'], interval: 333 },
  { name: 'Ellipsis', frames: ['   ', '.  ', '.. ', '...'], interval: 333 },
]

// Demo tasks to show spinners in context
const TASKS = [
  'Installing dependencies',
  'Compiling source files',
  'Running type checker',
  'Bundling modules',
  'Optimizing assets',
  'Generating routes',
  'Building manifest',
  'Uploading artifacts',
  'Deploying to edge',
  'Invalidating cache',
  'Verifying deployment',
]

export function Spinner() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [paused, setPaused] = useState(false)
  const [frameIndices, setFrameIndices] = useState<number[]>(
    new Array(SPINNERS.length).fill(0),
  )
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor((c) => Math.max(0, c - 1))
    else if (key.downArrow || ch === 'j')
      setCursor((c) => Math.min(SPINNERS.length - 1, c + 1))
    else if (ch === ' ') setPaused((p) => !p)
  })

  // Each spinner runs on its own interval
  useEffect(() => {
    const timers = SPINNERS.map((s, i) =>
      setInterval(() => {
        if (!pausedRef.current) {
          setFrameIndices((prev) => {
            const next = [...prev]
            next[i] = (next[i] + 1) % s.frames.length
            return next
          })
        }
      }, s.interval),
    )
    return () => timers.forEach(clearInterval)
  }, [])

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>
          Spinner
        </Text>
        <Text dimColor>{SPINNERS.length} styles</Text>
        {paused && <Text color={colors.warning}>paused</Text>}
      </Box>

      {SPINNERS.map((s, i) => {
        const isActive = i === cursor
        const frame = s.frames[frameIndices[i]] ?? ''
        const task = TASKS[i] ?? 'Processing'

        return (
          <Box key={s.name} gap={1}>
            <Text color={isActive ? colors.primary : 'gray'}>
              {isActive ? '▸' : ' '}
            </Text>
            <Box width={5}>
              <Text color={isActive ? colors.info : colors.secondary}>
                {frame}
              </Text>
            </Box>
            <Box width={12}>
              <Text
                color={isActive ? 'white' : undefined}
                bold={isActive}
              >
                {s.name}
              </Text>
            </Box>
            <Text dimColor>{task}...</Text>
          </Box>
        )
      })}

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold>
            {' '}
            ↑↓{' '}
          </Text>
          <Text dimColor> navigate</Text>
        </Box>
        <Box>
          <Text inverse bold>
            {' '}
            space{' '}
          </Text>
          <Text dimColor> {paused ? 'resume' : 'pause'}</Text>
        </Box>
      </Box>
    </Box>
  )
}
