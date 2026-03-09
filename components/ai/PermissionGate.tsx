import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, SPIN } from './utils'

type Decision = 'pending' | 'allow' | 'deny' | 'always'

interface Permission {
  id: string
  tool: string
  target: string
  decision: Decision
}

const QUEUE: Omit<Permission, 'decision'>[] = [
  { id: '1', tool: 'Read', target: 'src/config.ts' },
  { id: '2', tool: 'Edit', target: 'src/routes.ts' },
  { id: '3', tool: 'Bash', target: 'npm test' },
  { id: '4', tool: 'Write', target: 'src/auth.ts' },
  { id: '5', tool: 'Bash', target: 'git push origin main' },
]

const TOOL_COLORS: Record<string, (c: ReturnType<typeof useTheme>) => string> = {
  Read: c => c.info,
  Edit: c => c.success,
  Bash: c => c.warning,
  Write: c => c.primary,
}

export function AIPermissionGate() {
  const colors = useTheme()
  const [perms, setPerms] = useState<Permission[]>([])
  const [frame, setFrame] = useState(0)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setPerms([])
    const timers = QUEUE.map((p, i) =>
      setTimeout(() => setPerms(prev => [...prev, { ...p, decision: 'pending' }]), i * 2800)
    )
    return () => timers.forEach(clearTimeout)
  }, [runId])

  const pending = perms.find(p => p.decision === 'pending')

  function decide(d: Decision) {
    if (!pending) return
    setPerms(prev => prev.map(p => p.id === pending.id ? { ...p, decision: d } : p))
  }

  useInput((ch) => {
    if (ch === 'y') decide('allow')
    if (ch === 'n') decide('deny')
    if (ch === 'a') decide('always')
    if (ch === 'r') setRunId(n => n + 1)
  })

  const resolved = perms.filter(p => p.decision !== 'pending')

  return (
    <Box flexDirection="column" padding={1}>
      {/* Active prompt */}
      {pending ? (
        <Box flexDirection="column" marginBottom={1} borderStyle="round" borderColor={colors.warning} paddingX={2} paddingY={1}>
          <Box gap={1}>
            <Text color={colors.warning}>{SPIN[frame % SPIN.length]}</Text>
            <Text bold>Allow</Text>
            <Badge label={pending.tool} color={TOOL_COLORS[pending.tool]?.(colors) ?? colors.primary} />
            <Text>{pending.target}</Text>
            <Text dimColor>?</Text>
          </Box>
          <Box marginTop={1} gap={2}>
            <Box><Text inverse bold color={colors.success}> y </Text><Text dimColor> allow</Text></Box>
            <Box><Text inverse bold color={colors.error}> n </Text><Text dimColor> deny</Text></Box>
            <Box><Text inverse bold color={colors.info}> a </Text><Text dimColor> always</Text></Box>
          </Box>
        </Box>
      ) : perms.length > 0 ? (
        <Box marginBottom={1}><Text dimColor>All permissions resolved.</Text></Box>
      ) : (
        <Box marginBottom={1}><Text dimColor>Waiting...</Text></Box>
      )}

      {/* History */}
      {resolved.map(p => {
        const tc = TOOL_COLORS[p.tool]?.(colors) ?? colors.primary
        return (
          <Box key={p.id} gap={1}>
            <Text color={p.decision === 'deny' ? colors.error : colors.success}>
              {p.decision === 'deny' ? '\u2717' : '\u2713'}
            </Text>
            <Text color={tc} bold>{p.tool}</Text>
            <Text dimColor>{p.target}</Text>
            {p.decision === 'always' && <Text color={colors.info} dimColor>(always)</Text>}
          </Box>
        )
      })}

      <Help keys={pending ? [
        { key: 'y', label: 'allow' },
        { key: 'n', label: 'deny' },
        { key: 'a', label: 'always' },
      ] : [{ key: 'r', label: 'restart' }]} />
    </Box>
  )
}
