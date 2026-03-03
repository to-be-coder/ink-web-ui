import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

type LineType = 'add' | 'remove' | 'context'

interface DiffLine {
  type: LineType
  content: string
  oldNum?: number
  newNum?: number
}

interface Hunk {
  header: string
  lines: DiffLine[]
  status: 'pending' | 'accepted' | 'rejected'
}

interface DiffFile {
  filename: string
  additions: number
  deletions: number
  hunks: Hunk[]
}

interface State {
  fileIndex: number
  hunkIndex: number
  scrollOffset: number
}

type Action =
  | { type: 'next_file' }
  | { type: 'prev_file' }
  | { type: 'next_hunk' }
  | { type: 'prev_hunk' }
  | { type: 'accept' }
  | { type: 'reject' }
  | { type: 'reset' }
  | { type: 'scroll_down' }
  | { type: 'scroll_up' }

const DEMO_FILES: DiffFile[] = [
  {
    filename: 'src/auth.ts',
    additions: 8,
    deletions: 3,
    hunks: [
      {
        header: '@@ -12,7 +12,10 @@',
        status: 'pending',
        lines: [
          { type: 'context', content: 'import { hash } from "./crypto";', oldNum: 12, newNum: 12 },
          { type: 'context', content: 'import { db } from "./database";', oldNum: 13, newNum: 13 },
          { type: 'remove', content: 'import { validate } from "./utils";', oldNum: 14 },
          { type: 'add', content: 'import { validate, sanitize } from "./utils";', newNum: 14 },
          { type: 'add', content: 'import { rateLimit } from "./middleware";', newNum: 15 },
          { type: 'context', content: '', oldNum: 15, newNum: 16 },
          { type: 'context', content: 'export async function login(email: string, password: string) {', oldNum: 16, newNum: 17 },
        ],
      },
      {
        header: '@@ -24,6 +27,11 @@',
        status: 'pending',
        lines: [
          { type: 'context', content: '  const user = await db.findUser(email);', oldNum: 24, newNum: 27 },
          { type: 'context', content: '  if (!user) throw new AuthError("not found");', oldNum: 25, newNum: 28 },
          { type: 'remove', content: '  const valid = await hash.compare(password, user.hash);', oldNum: 26 },
          { type: 'add', content: '  const sanitized = sanitize(password);', newNum: 29 },
          { type: 'add', content: '  const valid = await hash.compare(sanitized, user.hash);', newNum: 30 },
          { type: 'add', content: '  if (!valid) {', newNum: 31 },
          { type: 'add', content: '    await rateLimit.record(email);', newNum: 32 },
          { type: 'add', content: '    throw new AuthError("invalid credentials");', newNum: 33 },
          { type: 'add', content: '  }', newNum: 34 },
          { type: 'remove', content: '  if (!valid) throw new AuthError("invalid");', oldNum: 27 },
          { type: 'context', content: '  return generateToken(user);', oldNum: 28, newNum: 35 },
        ],
      },
    ],
  },
  {
    filename: 'src/api/routes.ts',
    additions: 5,
    deletions: 2,
    hunks: [
      {
        header: '@@ -8,5 +8,8 @@',
        status: 'pending',
        lines: [
          { type: 'context', content: 'router.get("/health", (_req, res) => {', oldNum: 8, newNum: 8 },
          { type: 'remove', content: '  res.json({ status: "ok" });', oldNum: 9 },
          { type: 'add', content: '  const uptime = process.uptime();', newNum: 9 },
          { type: 'add', content: '  const memory = process.memoryUsage();', newNum: 10 },
          { type: 'add', content: '  res.json({ status: "ok", uptime, memory });', newNum: 11 },
          { type: 'context', content: '});', oldNum: 10, newNum: 12 },
        ],
      },
      {
        header: '@@ -31,4 +34,6 @@',
        status: 'pending',
        lines: [
          { type: 'context', content: 'router.post("/logout", auth, (req, res) => {', oldNum: 31, newNum: 34 },
          { type: 'remove', content: '  req.session.destroy();', oldNum: 32 },
          { type: 'add', content: '  await req.session.destroy();', newNum: 35 },
          { type: 'add', content: '  res.clearCookie("sid");', newNum: 36 },
          { type: 'context', content: '  res.status(204).end();', oldNum: 33, newNum: 37 },
          { type: 'context', content: '});', oldNum: 34, newNum: 38 },
        ],
      },
    ],
  },
  {
    filename: 'tests/auth.test.ts',
    additions: 6,
    deletions: 0,
    hunks: [
      {
        header: '@@ -45,3 +45,9 @@',
        status: 'pending',
        lines: [
          { type: 'context', content: '  expect(token).toBeDefined();', oldNum: 45, newNum: 45 },
          { type: 'context', content: '});', oldNum: 46, newNum: 46 },
          { type: 'add', content: '', newNum: 47 },
          { type: 'add', content: 'test("rate limits after failed attempts", async () => {', newNum: 48 },
          { type: 'add', content: '  for (let i = 0; i < 5; i++) {', newNum: 49 },
          { type: 'add', content: '    await expect(login("test@example.com", "wrong")).rejects.toThrow();', newNum: 50 },
          { type: 'add', content: '  }', newNum: 51 },
          { type: 'add', content: '  await expect(login("test@example.com", "correct")).rejects.toThrow("rate limited");', newNum: 52 },
          { type: 'context', content: '});', oldNum: 47, newNum: 53 },
        ],
      },
    ],
  },
]

function reducer(state: State, action: Action): State {
  const file = DEMO_FILES[state.fileIndex]!
  switch (action.type) {
    case 'next_file':
      return { fileIndex: (state.fileIndex + 1) % DEMO_FILES.length, hunkIndex: 0, scrollOffset: 0 }
    case 'prev_file':
      return { fileIndex: (state.fileIndex - 1 + DEMO_FILES.length) % DEMO_FILES.length, hunkIndex: 0, scrollOffset: 0 }
    case 'next_hunk':
      return { ...state, hunkIndex: Math.min(state.hunkIndex + 1, file.hunks.length - 1) }
    case 'prev_hunk':
      return { ...state, hunkIndex: Math.max(state.hunkIndex - 1, 0) }
    case 'accept': {
      file.hunks[state.hunkIndex]!.status = 'accepted'
      return { ...state }
    }
    case 'reject': {
      file.hunks[state.hunkIndex]!.status = 'rejected'
      return { ...state }
    }
    case 'scroll_down':
      return { ...state, scrollOffset: state.scrollOffset + 1 }
    case 'scroll_up':
      return { ...state, scrollOffset: Math.max(0, state.scrollOffset - 1) }
    case 'reset': {
      for (const f of DEMO_FILES) {
        for (const h of f.hunks) {
          h.status = 'pending'
        }
      }
      return { fileIndex: 0, hunkIndex: 0, scrollOffset: 0 }
    }
  }
}

function LineNumber({ num, width }: { num?: number; width: number }) {
  const str = num != null ? String(num).padStart(width) : ' '.repeat(width)
  return <Text dimColor>{str}</Text>
}

function DiffLineRow({ line, oldWidth, newWidth, highlight }: {
  line: DiffLine
  oldWidth: number
  newWidth: number
  highlight: boolean
}) {
  const colors = useTheme()
  const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '
  const color = line.type === 'add' ? colors.success : line.type === 'remove' ? colors.error : undefined
  const bg = highlight
    ? line.type === 'add' ? colors.success : line.type === 'remove' ? colors.error : undefined
    : undefined

  return (
    <Box>
      <LineNumber num={line.oldNum} width={oldWidth} />
      <Text dimColor> </Text>
      <LineNumber num={line.newNum} width={newWidth} />
      <Text dimColor> </Text>
      <Text color={color} backgroundColor={bg} dimColor={bg != null}>
        {prefix} {line.content}
      </Text>
    </Box>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'accepted' | 'rejected' }) {
  const colors = useTheme()
  if (status === 'accepted') return <Text color={colors.success} bold> accepted </Text>
  if (status === 'rejected') return <Text color={colors.error} bold> rejected </Text>
  return <Text color={colors.warning}> pending </Text>
}

function FileTab({ file, active }: { file: DiffFile; active: boolean }) {
  const colors = useTheme()
  return (
    <Box>
      <Text color={active ? 'white' : 'gray'} bold={active}>
        {file.filename}
      </Text>
      <Text color={colors.success}> +{file.additions}</Text>
      <Text color={colors.error}> -{file.deletions}</Text>
    </Box>
  )
}

const MAX_VISIBLE_LINES = 12

export function DiffViewer() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    fileIndex: 0,
    hunkIndex: 0,
    scrollOffset: 0,
  })

  const file = DEMO_FILES[state.fileIndex]!
  const { hunkIndex, scrollOffset } = state

  useInput((ch, key) => {
    if (key.tab) dispatch({ type: 'next_file' })
    else if (ch === 'j' || key.downArrow) dispatch({ type: 'scroll_down' })
    else if (ch === 'k' || key.upArrow) dispatch({ type: 'scroll_up' })
    else if (key.rightArrow || ch === ']') dispatch({ type: 'next_hunk' })
    else if (key.leftArrow || ch === '[') dispatch({ type: 'prev_hunk' })
    else if (ch === 'a') dispatch({ type: 'accept' })
    else if (ch === 'x') dispatch({ type: 'reject' })
    else if (ch === 'r') dispatch({ type: 'reset' })
  })

  const allLines: { line: DiffLine; hunkIdx: number }[] = []
  for (let hi = 0; hi < file.hunks.length; hi++) {
    const hunk = file.hunks[hi]!
    for (const line of hunk.lines) {
      allLines.push({ line, hunkIdx: hi })
    }
  }

  const visibleLines = allLines.slice(scrollOffset, scrollOffset + MAX_VISIBLE_LINES)
  const maxOld = Math.max(...allLines.map(l => l.line.oldNum ?? 0))
  const maxNew = Math.max(...allLines.map(l => l.line.newNum ?? 0))
  const oldWidth = String(maxOld).length
  const newWidth = String(maxNew).length

  const accepted = file.hunks.filter(h => h.status === 'accepted').length
  const rejected = file.hunks.filter(h => h.status === 'rejected').length
  const pending = file.hunks.filter(h => h.status === 'pending').length

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={3}>
        {DEMO_FILES.map((f, i) => (
          <FileTab key={f.filename} file={f} active={i === state.fileIndex} />
        ))}
      </Box>

      <Box marginBottom={1} gap={2}>
        <Text dimColor>Hunk {hunkIndex + 1}/{file.hunks.length}</Text>
        <StatusBadge status={file.hunks[hunkIndex]!.status} />
        <Box gap={1}>
          <Text color={colors.success}>{accepted} accepted</Text>
          <Text color={colors.error}>{rejected} rejected</Text>
          <Text color={colors.warning}>{pending} pending</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        {visibleLines.map((entry, i) => (
          <DiffLineRow
            key={scrollOffset + i}
            line={entry.line}
            oldWidth={oldWidth}
            newWidth={newWidth}
            highlight={entry.hunkIdx === hunkIndex}
          />
        ))}
      </Box>

      {allLines.length > MAX_VISIBLE_LINES && (
        <Text dimColor>
          {scrollOffset > 0 ? '...' : '   '} lines {scrollOffset + 1}-{Math.min(scrollOffset + MAX_VISIBLE_LINES, allLines.length)} of {allLines.length} {scrollOffset + MAX_VISIBLE_LINES < allLines.length ? '...' : '   '}
        </Text>
      )}

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> a </Text>
          <Text dimColor> accept</Text>
        </Box>
        <Box>
          <Text inverse bold> x </Text>
          <Text dimColor> reject</Text>
        </Box>
        <Box>
          <Text inverse bold> [/] </Text>
          <Text dimColor> hunk</Text>
        </Box>
        <Box>
          <Text inverse bold> tab </Text>
          <Text dimColor> file</Text>
        </Box>
        <Box>
          <Text inverse bold> r </Text>
          <Text dimColor> reset</Text>
        </Box>
      </Box>
    </Box>
  )
}
