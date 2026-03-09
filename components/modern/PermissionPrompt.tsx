import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Badge } from './utils'

/* ── Types ── */

type Severity = 'info' | 'warning' | 'danger'
type Decision = 'pending' | 'allowed' | 'denied' | 'session'

interface PermissionRequest {
  id: string
  action: string
  detail: string
  severity: Severity
  paths?: string[]
  decision: Decision
}

/* ── Demo data ── */

const REQUESTS: Omit<PermissionRequest, 'decision'>[] = [
  {
    id: '1',
    action: 'Read file',
    detail: 'Read src/config.ts to check environment variables',
    severity: 'info',
    paths: ['src/config.ts'],
  },
  {
    id: '2',
    action: 'Edit file',
    detail: 'Add auth middleware to routes',
    severity: 'warning',
    paths: ['src/routes.ts', 'src/app.ts'],
  },
  {
    id: '3',
    action: 'Run command',
    detail: 'npm test -- --watch',
    severity: 'warning',
  },
  {
    id: '4',
    action: 'Delete file',
    detail: 'Remove deprecated auth helper',
    severity: 'danger',
    paths: ['src/old-auth.ts'],
  },
  {
    id: '5',
    action: 'Run command',
    detail: 'git push origin main',
    severity: 'danger',
  },
]

/* ── Main ── */

export function ModernPermissionPrompt() {
  const colors = useTheme()
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [runId, setRunId] = useState(0)
  const [log, setLog] = useState<{ action: string; decision: Decision }[]>([])

  const severityColor: Record<Severity, string> = {
    info: colors.info,
    warning: colors.warning,
    danger: colors.error,
  }

  const severityIcon: Record<Severity, string> = {
    info: '\u25CF',
    warning: '\u26A0',
    danger: '\u25CF',
  }

  // Auto-queue permission requests
  useEffect(() => {
    setRequests([])
    setActiveIdx(0)
    setLog([])

    const timers = REQUESTS.map((req, i) =>
      setTimeout(() => {
        setRequests(prev => [...prev, { ...req, decision: 'pending' }])
      }, i * 3000)
    )

    return () => timers.forEach(clearTimeout)
  }, [runId])

  const pending = requests.filter(r => r.decision === 'pending')
  const current = pending[0]

  function decide(decision: Decision) {
    if (!current) return
    setRequests(prev => prev.map(r => r.id === current.id ? { ...r, decision } : r))
    setLog(prev => [...prev, { action: current.action + ': ' + current.detail, decision }])
  }

  useInput((ch) => {
    if (!current) {
      if (ch === 'r') setRunId(n => n + 1)
      return
    }
    if (ch === 'y' || ch === 'a') decide('allowed')
    if (ch === 'n' || ch === 'd') decide('denied')
    if (ch === 's') decide('session')
    if (ch === 'r') setRunId(n => n + 1)
  })

  const decided = requests.filter(r => r.decision !== 'pending')

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>Permissions</Text>
          <Box gap={1}>
            {pending.length > 0 && (
              <Badge label={`${pending.length} pending`} color={colors.warning} />
            )}
            {decided.length > 0 && (
              <Text dimColor>{decided.length} resolved</Text>
            )}
          </Box>
        </Box>

        {/* Active permission prompt */}
        {current ? (
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={severityColor[current.severity]}
            paddingX={2}
            paddingY={1}
            marginBottom={1}
          >
            <Box gap={1} marginBottom={1}>
              <Text color={severityColor[current.severity]}>{severityIcon[current.severity]}</Text>
              <Text bold color={severityColor[current.severity]}>{current.action}</Text>
              <Badge label={current.severity.toUpperCase()} color={severityColor[current.severity]} />
            </Box>

            <Text>{current.detail}</Text>

            {current.paths && (
              <Box flexDirection="column" marginTop={1}>
                {current.paths.map(p => (
                  <Box key={p} gap={1}>
                    <Text color={severityColor[current.severity]}>{'\u2502'}</Text>
                    <Text dimColor>{p}</Text>
                  </Box>
                ))}
              </Box>
            )}

            <Box marginTop={1} gap={2}>
              <Box><Text inverse bold color={colors.success}> y </Text><Text dimColor> allow</Text></Box>
              <Box><Text inverse bold color={colors.error}> n </Text><Text dimColor> deny</Text></Box>
              <Box><Text inverse bold color={colors.info}> s </Text><Text dimColor> allow session</Text></Box>
            </Box>
          </Box>
        ) : requests.length > 0 ? (
          <Box marginBottom={1}>
            <Text color={colors.success} bold>All permissions resolved</Text>
          </Box>
        ) : (
          <Box marginBottom={1}>
            <Text dimColor>Waiting for permission requests...</Text>
          </Box>
        )}

        {/* Decision log */}
        {log.length > 0 && (
          <Box flexDirection="column">
            <Text dimColor bold>History</Text>
            {log.map((entry, i) => (
              <Box key={i} gap={1}>
                <Text color={
                  entry.decision === 'allowed' ? colors.success
                    : entry.decision === 'session' ? colors.info
                    : colors.error
                }>
                  {entry.decision === 'allowed' ? '\u2714' : entry.decision === 'session' ? '\u2714' : '\u2718'}
                </Text>
                <Text dimColor>{entry.action}</Text>
                <Badge
                  label={entry.decision === 'session' ? 'SESSION' : entry.decision.toUpperCase()}
                  color={
                    entry.decision === 'allowed' ? colors.success
                      : entry.decision === 'session' ? colors.info
                      : colors.error
                  }
                />
              </Box>
            ))}
          </Box>
        )}

        <HelpFooter keys={[
          ...(current ? [
            { key: 'y', label: 'allow' },
            { key: 'n', label: 'deny' },
            { key: 's', label: 'session' },
          ] : []),
          { key: 'r', label: 'restart' },
        ]} />
      </Card>
    </Box>
  )
}
