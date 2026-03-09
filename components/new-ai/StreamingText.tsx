import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep, SPIN } from './utils'

const SAMPLE_TEXT = `I'll help you build a REST API with Express and TypeScript.

First, let's set up the project structure:

  src/
  ├── index.ts        Entry point
  ├── routes/
  │   ├── users.ts    User endpoints
  │   └── auth.ts     Authentication
  ├── middleware/
  │   └── validate.ts Request validation
  └── types.ts        Shared types

Here's the main server file:

  import express from 'express'
  import { userRouter } from './routes/users'
  import { authRouter } from './routes/auth'

  const app = express()
  app.use(express.json())
  app.use('/api/users', userRouter)
  app.use('/api/auth', authRouter)
  app.listen(3000)

The user router handles CRUD operations with proper error handling and input validation using Zod schemas.`

type Mode = 'typewriter' | 'word' | 'line' | 'instant'

const MODES: Mode[] = ['typewriter', 'word', 'line', 'instant']
const MODE_LABELS: Record<Mode, string> = {
  typewriter: 'Character',
  word: 'Word',
  line: 'Line',
  instant: 'Instant',
}
const SPEEDS = [10, 20, 40, 80]
const SPEED_LABELS = ['4x', '2x', '1x', '0.5x']

export function NewAIStreamingText() {
  const colors = useTheme()
  const [modeIdx, setModeIdx] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(1)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(true)
  const [frame, setFrame] = useState(0)
  const [runId, setRunId] = useState(0)

  const mode = MODES[modeIdx]!
  const speed = SPEEDS[speedIdx]!

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setProgress(0)
    setRunning(true)

    const getChunks = () => {
      if (mode === 'instant') return [SAMPLE_TEXT]
      if (mode === 'line') return SAMPLE_TEXT.split('\n').map((l, i, a) => a.slice(0, i + 1).join('\n'))
      if (mode === 'word') {
        const words = SAMPLE_TEXT.split(/(\s+)/)
        const chunks: string[] = []
        let acc = ''
        for (const w of words) { acc += w; chunks.push(acc) }
        return chunks
      }
      // typewriter
      return Array.from({ length: SAMPLE_TEXT.length }, (_, i) => i + 1)
    }

    const chunks = getChunks()
    if (mode === 'instant') {
      setProgress(SAMPLE_TEXT.length)
      setRunning(false)
      return
    }

    let i = 0
    const interval = setInterval(() => {
      if (i >= chunks.length) {
        setRunning(false)
        clearInterval(interval)
        return
      }
      const chunk = chunks[i]!
      setProgress(typeof chunk === 'number' ? chunk : chunk.length)
      i++
    }, speed)

    return () => clearInterval(interval)
  }, [mode, speed, runId])

  const displayText = mode === 'line' && progress < SAMPLE_TEXT.length
    ? SAMPLE_TEXT.split('\n').slice(0, Math.max(1, Math.ceil(progress / 40))).join('\n')
    : SAMPLE_TEXT.slice(0, progress)

  const pct = Math.min(100, Math.round((progress / SAMPLE_TEXT.length) * 100))

  useInput((ch) => {
    if (ch === 'm') setModeIdx(i => (i + 1) % MODES.length)
    if (ch === 's') setSpeedIdx(i => (i + 1) % SPEEDS.length)
    if (ch === 'r') setRunId(n => n + 1)
  })

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box gap={2} marginBottom={1}>
        <Badge label="Streaming" color={colors.info} />
        <Box gap={1}>
          <Text dimColor>Mode:</Text>
          <Text bold color={colors.primary}>{MODE_LABELS[mode]}</Text>
        </Box>
        <Box gap={1}>
          <Text dimColor>Speed:</Text>
          <Text bold color={colors.warning}>{SPEED_LABELS[speedIdx]}</Text>
        </Box>
      </Box>

      <Sep color={colors.secondary} />

      {/* Streaming content */}
      <Box flexDirection="column" marginTop={1} marginBottom={1}>
        {displayText.split('\n').map((line, i) => {
          if (line.startsWith('  ├') || line.startsWith('  └') || line.startsWith('  │') || line.startsWith('  src/')) {
            return <Text key={i} color={colors.info}>{line}</Text>
          }
          if (line.startsWith('  import') || line.startsWith('  const') || line.startsWith('  app.')) {
            const kw = line.match(/^\s*(import|const|from)\b/)
            if (kw) {
              return (
                <Text key={i}>
                  <Text color={colors.secondary}>{line.slice(0, line.indexOf(kw[1]!))}{kw[1]}</Text>
                  <Text>{line.slice(line.indexOf(kw[1]!) + kw[1]!.length)}</Text>
                </Text>
              )
            }
            return <Text key={i}>{line}</Text>
          }
          return <Text key={i}>{line}</Text>
        })}
        {running && <Text color={colors.primary}>{SPIN[frame % SPIN.length]} █</Text>}
      </Box>

      {/* Progress bar */}
      <Box gap={1}>
        <Text dimColor>Progress</Text>
        <Text>
          <Text color={running ? colors.primary : colors.success}>{'█'.repeat(Math.round(pct / 5))}</Text>
          <Text dimColor>{'░'.repeat(20 - Math.round(pct / 5))}</Text>
        </Text>
        <Text bold color={running ? colors.primary : colors.success}>{pct}%</Text>
        <Text dimColor>{progress}/{SAMPLE_TEXT.length} chars</Text>
      </Box>

      <Help keys={[
        { key: 'm', label: 'mode' },
        { key: 's', label: 'speed' },
        { key: 'r', label: 'restart' },
      ]} />
    </Box>
  )
}
