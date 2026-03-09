import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge } from './utils'

type ChangeType = 'created' | 'modified' | 'deleted'

interface FileChangeData {
  path: string
  type: ChangeType
  additions: number
  deletions: number
}

const CHANGES: FileChangeData[] = [
  { path: 'src/auth.ts', type: 'created', additions: 38, deletions: 0 },
  { path: 'src/routes.ts', type: 'modified', additions: 5, deletions: 1 },
  { path: 'src/app.ts', type: 'modified', additions: 2, deletions: 0 },
  { path: 'src/types.ts', type: 'modified', additions: 6, deletions: 0 },
  { path: 'src/old-auth.ts', type: 'deleted', additions: 0, deletions: 24 },
]

export function AIFileChange() {
  const colors = useTheme()
  const [visible, setVisible] = useState<FileChangeData[]>([])
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    setVisible([])
    const timers = CHANGES.map((change, i) =>
      setTimeout(() => setVisible(prev => [...prev, change]), (i + 1) * 800)
    )
    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch) => { if (ch === 'r') setRunId(n => n + 1) })

  const typeColor: Record<ChangeType, string> = {
    created: colors.success,
    modified: colors.warning,
    deleted: colors.error,
  }

  const typeLabel: Record<ChangeType, string> = {
    created: 'NEW',
    modified: 'MOD',
    deleted: 'DEL',
  }

  const totalAdd = visible.reduce((s, c) => s + c.additions, 0)
  const totalDel = visible.reduce((s, c) => s + c.deletions, 0)

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold>File Changes</Text>
        {visible.length > 0 && (
          <Box gap={1}>
            <Text dimColor>{visible.length} files</Text>
            <Text color={colors.success}>+{totalAdd}</Text>
            <Text color={colors.error}>-{totalDel}</Text>
          </Box>
        )}
      </Box>

      {visible.map(change => {
        const tc = typeColor[change.type]
        const barLen = Math.min(20, change.additions + change.deletions)
        const addBar = Math.round((change.additions / Math.max(1, change.additions + change.deletions)) * barLen)
        const delBar = barLen - addBar

        return (
          <Box key={change.path} gap={1}>
            <Badge label={typeLabel[change.type]} color={tc} />
            <Text>{change.path}</Text>
            <Box>
              <Text color={colors.success}>{'\u2588'.repeat(addBar)}</Text>
              <Text color={colors.error}>{'\u2588'.repeat(delBar)}</Text>
            </Box>
            <Text dimColor>+{change.additions} -{change.deletions}</Text>
          </Box>
        )
      })}

      {visible.length === 0 && <Text dimColor>No changes yet.</Text>}

      <Help keys={[{ key: 'r', label: 'restart' }]} />
    </Box>
  )
}
