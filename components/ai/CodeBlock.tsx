import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge } from './utils'

const CODE_SAMPLES = [
  {
    file: 'src/auth.ts',
    lang: 'TypeScript',
    lines: [
      "import jwt from 'jsonwebtoken'",
      "import { Request, Response, NextFunction } from 'express'",
      '',
      'const SECRET = process.env.JWT_SECRET!',
      '',
      'export function verifyToken(token: string) {',
      '  return jwt.verify(token, SECRET)',
      '}',
      '',
      'export function requireAuth(req: Request, res: Response, next: NextFunction) {',
      '  const header = req.headers.authorization',
      "  if (!header) return res.status(401).json({ error: 'Missing token' })",
      '  try {',
      "    req.user = verifyToken(header.replace('Bearer ', ''))",
      '    next()',
      '  } catch {',
      "    res.status(401).json({ error: 'Invalid token' })",
      '  }',
      '}',
    ],
  },
  {
    file: 'src/routes.ts',
    lang: 'TypeScript',
    lines: [
      "import express from 'express'",
      "import { requireAuth } from './auth'",
      '',
      'const router = express.Router()',
      '',
      "router.get('/health', (req, res) => {",
      "  res.json({ status: 'ok' })",
      '})',
      '',
      "router.use('/users', requireAuth)",
      '',
      'export default router',
    ],
  },
]

export function AICodeBlock() {
  const colors = useTheme()
  const [fileIdx, setFileIdx] = useState(0)
  const [copied, setCopied] = useState(false)
  const sample = CODE_SAMPLES[fileIdx]!

  useInput((ch, key) => {
    if (ch === 'f' || key.tab) { setFileIdx(i => (i + 1) % CODE_SAMPLES.length); setCopied(false) }
    if (ch === 'c') { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  })

  const gw = String(sample.lines.length).length + 1

  // Simple keyword coloring
  const keywords = ['import', 'from', 'export', 'function', 'const', 'return', 'if', 'try', 'catch']

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={0}>
        <Box gap={1}>
          <Badge label={sample.lang} color={colors.info} />
          <Text bold>{sample.file}</Text>
        </Box>
        <Box gap={1}>
          {copied && <Text color={colors.success}>Copied!</Text>}
          <Text dimColor>{sample.lines.length} lines</Text>
        </Box>
      </Box>

      <Text dimColor wrap="truncate-end">{'\u2500'.repeat(60)}</Text>

      {/* Code lines */}
      {sample.lines.map((line, i) => (
        <Box key={i}>
          <Text dimColor>{String(i + 1).padStart(gw)} </Text>
          <Text dimColor>{'\u2502'} </Text>
          <Text>{colorLine(line, colors, keywords)}</Text>
        </Box>
      ))}

      <Help keys={[
        { key: 'f', label: 'next file' },
        { key: 'c', label: 'copy' },
      ]} />
    </Box>
  )
}

function colorLine(line: string, colors: ReturnType<typeof useTheme>, keywords: string[]) {
  // String literals
  if (line.includes("'")) {
    const parts = line.split("'")
    return <Text>{parts.map((p, i) => i % 2 === 1 ? <Text key={i} color={colors.success}>'{p}'</Text> : <Text key={i}>{colorWords(p, colors, keywords)}</Text>)}</Text>
  }
  return colorWords(line, colors, keywords)
}

function colorWords(text: string, colors: ReturnType<typeof useTheme>, keywords: string[]) {
  const words = text.split(/(\s+)/)
  return <Text>{words.map((w, i) => keywords.includes(w) ? <Text key={i} color={colors.secondary}>{w}</Text> : <Text key={i}>{w}</Text>)}</Text>
}
