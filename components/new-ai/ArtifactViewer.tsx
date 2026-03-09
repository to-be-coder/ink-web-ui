import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep } from './utils'

interface ArtifactVersion {
  label: string
  timestamp: string
  lines: string[]
  lang: string
}

const VERSIONS: ArtifactVersion[] = [
  {
    label: 'v1 — initial',
    timestamp: '10:24 AM',
    lang: 'TypeScript',
    lines: [
      "import express from 'express'",
      '',
      'const app = express()',
      'app.use(express.json())',
      '',
      "app.get('/health', (req, res) => {",
      "  res.json({ status: 'ok' })",
      '})',
      '',
      'app.listen(3000)',
    ],
  },
  {
    label: 'v2 — add routes',
    timestamp: '10:25 AM',
    lang: 'TypeScript',
    lines: [
      "import express from 'express'",
      "import { userRouter } from './routes/users'",
      "import { authRouter } from './routes/auth'",
      '',
      'const app = express()',
      'app.use(express.json())',
      '',
      "app.use('/api/users', userRouter)",
      "app.use('/api/auth', authRouter)",
      '',
      "app.get('/health', (req, res) => {",
      "  res.json({ status: 'ok' })",
      '})',
      '',
      'app.listen(3000)',
    ],
  },
  {
    label: 'v3 — error handling',
    timestamp: '10:26 AM',
    lang: 'TypeScript',
    lines: [
      "import express from 'express'",
      "import { userRouter } from './routes/users'",
      "import { authRouter } from './routes/auth'",
      "import { errorHandler } from './middleware/error'",
      '',
      'const app = express()',
      'app.use(express.json())',
      '',
      "app.use('/api/users', userRouter)",
      "app.use('/api/auth', authRouter)",
      '',
      "app.get('/health', (req, res) => {",
      "  res.json({ status: 'ok' })",
      '})',
      '',
      'app.use(errorHandler)',
      '',
      'const PORT = process.env.PORT || 3000',
      'app.listen(PORT, () => {',
      '  console.log(`Server running on port ${PORT}`)',
      '})',
    ],
  },
]

export function NewAIArtifactViewer() {
  const colors = useTheme()
  const [versionIdx, setVersionIdx] = useState(VERSIONS.length - 1)
  const [scroll, setScroll] = useState(0)
  const [showDiff, setShowDiff] = useState(false)

  const version = VERSIONS[versionIdx]!
  const prevVersion = versionIdx > 0 ? VERSIONS[versionIdx - 1] : null
  const gw = String(version.lines.length).length + 1
  const maxVisible = 14

  useInput((ch, key) => {
    if (key.leftArrow || ch === 'h') { setVersionIdx(i => Math.max(0, i - 1)); setScroll(0) }
    if (key.rightArrow || ch === 'l') { setVersionIdx(i => Math.min(VERSIONS.length - 1, i + 1)); setScroll(0) }
    if (key.upArrow || ch === 'k') setScroll(s => Math.max(0, s - 1))
    if (key.downArrow || ch === 'j') setScroll(s => Math.min(Math.max(0, version.lines.length - maxVisible), s + 1))
    if (ch === 'd') setShowDiff(d => !d)
  })

  // Compute diff
  const diffLines = showDiff && prevVersion
    ? computeDiff(prevVersion.lines, version.lines)
    : version.lines.map(l => ({ text: l, status: 'same' as const }))

  const visibleLines = diffLines.slice(scroll, scroll + maxVisible)

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={0}>
        <Box gap={1}>
          <Badge label="Artifact" color={colors.secondary} />
          <Text bold>src/index.ts</Text>
          <Badge label={version.lang} color={colors.info} />
        </Box>
        <Box gap={1}>
          {showDiff && <Badge label="DIFF" color={colors.warning} />}
          <Text dimColor>{version.lines.length} lines</Text>
        </Box>
      </Box>

      {/* Version tabs */}
      <Box gap={2} marginTop={1} marginBottom={0}>
        {VERSIONS.map((v, i) => (
          <Box key={i} gap={1}>
            <Text
              bold={i === versionIdx}
              color={i === versionIdx ? colors.primary : undefined}
              dimColor={i !== versionIdx}
              underline={i === versionIdx}
            >
              {v.label}
            </Text>
          </Box>
        ))}
      </Box>

      <Sep />

      {/* Code view */}
      <Box flexDirection="column" marginTop={0}>
        {visibleLines.map((line, i) => {
          const lineNum = scroll + i + 1
          const diffColor = line.status === 'added' ? colors.success
            : line.status === 'removed' ? colors.error
            : undefined
          const diffPrefix = line.status === 'added' ? '+' : line.status === 'removed' ? '-' : ' '

          return (
            <Box key={i}>
              {showDiff && (
                <Text color={diffColor} bold>{diffPrefix}</Text>
              )}
              <Text dimColor>{String(lineNum).padStart(gw)} </Text>
              <Text dimColor>│ </Text>
              <Text color={diffColor} dimColor={line.status === 'removed'}>
                {colorSyntax(line.text, colors)}
              </Text>
            </Box>
          )
        })}
      </Box>

      {/* Scroll indicator */}
      {diffLines.length > maxVisible && (
        <Box marginTop={0} gap={1}>
          <Text dimColor>
            ─ {scroll + 1}–{Math.min(scroll + maxVisible, diffLines.length)} of {diffLines.length} ─
          </Text>
        </Box>
      )}

      <Help keys={[
        { key: '◁/▷', label: 'version' },
        { key: 'j/k', label: 'scroll' },
        { key: 'd', label: 'diff' },
      ]} />
    </Box>
  )
}

function computeDiff(prev: string[], next: string[]): { text: string; status: 'same' | 'added' | 'removed' }[] {
  const result: { text: string; status: 'same' | 'added' | 'removed' }[] = []
  const prevSet = new Set(prev)
  const nextSet = new Set(next)

  // Simple line-based diff
  let pi = 0, ni = 0
  while (pi < prev.length || ni < next.length) {
    if (pi < prev.length && ni < next.length && prev[pi] === next[ni]) {
      result.push({ text: next[ni]!, status: 'same' })
      pi++; ni++
    } else if (ni < next.length && !prevSet.has(next[ni]!)) {
      result.push({ text: next[ni]!, status: 'added' })
      ni++
    } else if (pi < prev.length && !nextSet.has(prev[pi]!)) {
      result.push({ text: prev[pi]!, status: 'removed' })
      pi++
    } else {
      if (ni < next.length) { result.push({ text: next[ni]!, status: 'added' }); ni++ }
      if (pi < prev.length) { result.push({ text: prev[pi]!, status: 'removed' }); pi++ }
    }
  }
  return result
}

function colorSyntax(line: string, colors: ReturnType<typeof useTheme>) {
  const keywords = ['import', 'from', 'export', 'const', 'function', 'return', 'if', 'else']
  if (line.includes("'")) {
    const parts = line.split("'")
    return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.success}>'{p}'</Text> : <Text key={i}>{colorWords(p, colors, keywords)}</Text>)}</Text>
  }
  if (line.includes('`')) {
    const parts = line.split('`')
    return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.success}>`{p}`</Text> : <Text key={i}>{colorWords(p, colors, keywords)}</Text>)}</Text>
  }
  return colorWords(line, colors, keywords)
}

function colorWords(text: string, colors: ReturnType<typeof useTheme>, keywords: string[]) {
  const words = text.split(/(\s+)/)
  return <Text>{words.map((w, i) => keywords.includes(w) ? <Text key={i} color={colors.secondary}>{w}</Text> : <Text key={i}>{w}</Text>)}</Text>
}
