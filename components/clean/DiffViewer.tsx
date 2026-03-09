import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

type LineType = 'add' | 'remove' | 'context'

interface DiffLine { type: LineType; num: number; text: string }

interface DiffFile { path: string; add: number; del: number; lines: DiffLine[] }

const FILES: DiffFile[] = [
  {
    path: 'src/routes.ts', add: 4, del: 1,
    lines: [
      { type: 'context', num: 10, text: "import express from 'express'" },
      { type: 'context', num: 11, text: "import { userController } from './controllers'" },
      { type: 'remove', num: 12, text: '// TODO: add auth' },
      { type: 'add', num: 12, text: "import { requireAuth } from './auth'" },
      { type: 'add', num: 13, text: '' },
      { type: 'context', num: 14, text: 'const router = express.Router()' },
      { type: 'context', num: 23, text: "router.get('/health', (req, res) => {" },
      { type: 'add', num: 27, text: "router.use('/users', requireAuth)" },
      { type: 'add', num: 28, text: "router.post('/auth/login', authController.login)" },
      { type: 'context', num: 30, text: 'export default router' },
    ],
  },
  {
    path: 'src/auth.ts', add: 8, del: 0,
    lines: [
      { type: 'add', num: 1, text: "import jwt from 'jsonwebtoken'" },
      { type: 'add', num: 2, text: "import { Request, Response, NextFunction } from 'express'" },
      { type: 'add', num: 3, text: '' },
      { type: 'add', num: 4, text: 'export function verifyToken(token: string) {' },
      { type: 'add', num: 5, text: '  return jwt.verify(token, process.env.JWT_SECRET!)' },
      { type: 'add', num: 6, text: '}' },
      { type: 'add', num: 7, text: '' },
      { type: 'add', num: 8, text: 'export function requireAuth(req: Request, res: Response, next: NextFunction) {' },
    ],
  },
]

export function CleanDiffViewer() {
  const colors = useTheme()
  const [fileIdx, setFileIdx] = useState(0)
  const file = FILES[fileIdx]!
  const totalAdd = FILES.reduce((s, f) => s + f.add, 0)
  const totalDel = FILES.reduce((s, f) => s + f.del, 0)

  useInput((ch, key) => {
    if (ch === 'f' || key.tab) setFileIdx(i => (i + 1) % FILES.length)
  })

  useEffect(() => {}, [fileIdx])

  const gw = 4

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={2}>
          {FILES.map((f, i) => (
            <Text key={f.path} bold={i === fileIdx} dimColor={i !== fileIdx} color={i === fileIdx ? colors.primary : undefined}>
              {f.path}
            </Text>
          ))}
        </Box>
        <Box gap={1}>
          <Text color={colors.success}>+{totalAdd}</Text>
          <Text color={colors.error}>-{totalDel}</Text>
        </Box>
      </Box>

      {file.lines.map((line, i) => {
        const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '
        const lineColor = line.type === 'add' ? colors.success : line.type === 'remove' ? colors.error : undefined
        return (
          <Box key={i}>
            <Text dimColor>{String(line.num).padStart(gw)} </Text>
            <Text color={lineColor} dimColor={line.type === 'context'}>{prefix} {line.text}</Text>
          </Box>
        )
      })}

      <Help keys={[{ key: 'f', label: 'next file' }]} />
    </Box>
  )
}
