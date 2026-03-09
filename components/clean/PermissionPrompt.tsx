import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { G, Help } from './utils'

type Decision = 'pending' | 'allowed' | 'denied'

interface Req {
  id: string
  action: string
  detail: string
  risk: 'low' | 'high'
  decision: Decision
}

const REQUESTS: Omit<Req, 'decision'>[] = [
  { id: '1', action: 'Read file', detail: 'src/config.ts', risk: 'low' },
  { id: '2', action: 'Edit file', detail: 'src/routes.ts', risk: 'low' },
  { id: '3', action: 'Run command', detail: 'npm test', risk: 'low' },
  { id: '4', action: 'Delete file', detail: 'src/old-auth.ts', risk: 'high' },
  { id: '5', action: 'Run command', detail: 'git push origin main', risk: 'high' },
]

export function CleanPermissionPrompt() {
  const colors = useTheme()
  const [reqs, setReqs] = useState<Req[]>([])
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    setReqs([])
    const timers = REQUESTS.map((req, i) =>
      setTimeout(() => setReqs(prev => [...prev, { ...req, decision: 'pending' }]), i * 2500)
    )
    return () => timers.forEach(clearTimeout)
  }, [runId])

  const pending = reqs.find(r => r.decision === 'pending')

  function decide(d: Decision) {
    if (!pending) return
    setReqs(prev => prev.map(r => r.id === pending.id ? { ...r, decision: d } : r))
  }

  useInput((ch) => {
    if (ch === 'y') decide('allowed')
    if (ch === 'n') decide('denied')
    if (ch === 'r') setRunId(n => n + 1)
  })

  const resolved = reqs.filter(r => r.decision !== 'pending')

  return (
    <Box flexDirection="column" padding={1}>
      {/* Active prompt */}
      {pending ? (
        <Box flexDirection="column" marginBottom={1}>
          <Box gap={1}>
            <G s={pending.risk === 'high' ? 'error' : 'active'} />
            <Text bold>{pending.action}</Text>
            <Text dimColor>{pending.detail}</Text>
          </Box>
          <Box gap={1}>
            <G s="bar" />
            <Text dimColor>y allow  n deny</Text>
          </Box>
        </Box>
      ) : reqs.length > 0 ? (
        <Box marginBottom={1}><Text dimColor>All resolved.</Text></Box>
      ) : (
        <Box marginBottom={1}><Text dimColor>Waiting...</Text></Box>
      )}

      {/* Log */}
      {resolved.map(r => (
        <Box key={r.id} gap={1}>
          <Text color={r.decision === 'allowed' ? colors.success : colors.error}>
            {r.decision === 'allowed' ? '\u2713' : '\u2717'}
          </Text>
          <Text dimColor>{r.action}</Text>
          <Text dimColor>{r.detail}</Text>
        </Box>
      ))}

      <Help keys={pending ? [
        { key: 'y', label: 'allow' },
        { key: 'n', label: 'deny' },
      ] : [{ key: 'r', label: 'restart' }]} />
    </Box>
  )
}
