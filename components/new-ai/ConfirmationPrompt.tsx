import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep, SPIN } from './utils'

interface PendingAction {
  id: string
  tool: string
  description: string
  detail: string[]
  risk: 'low' | 'medium' | 'high'
  status: 'pending' | 'approved' | 'denied' | 'auto'
}

const ACTIONS: PendingAction[] = [
  {
    id: '1',
    tool: 'Write',
    description: 'Create src/auth.ts',
    detail: ['New file: 42 lines', 'Exports: verifyToken, requireAuth, generateToken'],
    risk: 'low',
    status: 'approved',
  },
  {
    id: '2',
    tool: 'Edit',
    description: 'Modify src/routes.ts',
    detail: ['Lines 12–18: Add auth middleware import', 'Lines 24–26: Wrap /users route with requireAuth'],
    risk: 'medium',
    status: 'approved',
  },
  {
    id: '3',
    tool: 'Bash',
    description: 'Run npm test',
    detail: ['Command: npm test --coverage', 'Working dir: /project'],
    risk: 'low',
    status: 'auto',
  },
  {
    id: '4',
    tool: 'Bash',
    description: 'Delete old auth files',
    detail: ['Command: rm -rf src/legacy-auth/', 'This will permanently remove 8 files'],
    risk: 'high',
    status: 'pending',
  },
  {
    id: '5',
    tool: 'Edit',
    description: 'Update package.json',
    detail: ['Add dependency: jsonwebtoken@9.0.2', 'Add dependency: @types/jsonwebtoken@9.0.5'],
    risk: 'medium',
    status: 'pending',
  },
]

export function NewAIConfirmationPrompt() {
  const colors = useTheme()
  const [actions, setActions] = useState(ACTIONS)
  const [cursor, setCursor] = useState(3) // Start on the pending high-risk action
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['4']))
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  const pendingCount = actions.filter(a => a.status === 'pending').length

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(actions.length - 1, c + 1))
    if (ch === 'y') {
      setActions(prev => prev.map((a, i) => i === cursor && a.status === 'pending' ? { ...a, status: 'approved' } : a))
    }
    if (ch === 'n') {
      setActions(prev => prev.map((a, i) => i === cursor && a.status === 'pending' ? { ...a, status: 'denied' } : a))
    }
    if (ch === 'a') {
      setActions(prev => prev.map(a => a.status === 'pending' ? { ...a, status: 'approved' } : a))
    }
    if (key.return || ch === ' ') {
      const action = actions[cursor]!
      setExpanded(s => {
        const next = new Set(s)
        if (next.has(action.id)) next.delete(action.id); else next.add(action.id)
        return next
      })
    }
    if (ch === 'r') {
      setActions(ACTIONS)
      setCursor(3)
    }
  })

  const riskColor = (risk: PendingAction['risk']) => {
    switch (risk) {
      case 'low': return colors.success
      case 'medium': return colors.warning
      case 'high': return colors.error
    }
  }

  const statusIcon = (status: PendingAction['status']) => {
    switch (status) {
      case 'approved': return { icon: '✓', color: colors.success }
      case 'denied': return { icon: '✗', color: colors.error }
      case 'auto': return { icon: '⚡', color: colors.info }
      case 'pending': return { icon: SPIN[frame % SPIN.length]!, color: colors.warning }
    }
  }

  const toolIcon = (tool: string) => {
    switch (tool) {
      case 'Write': return '📝'
      case 'Edit': return '✏️'
      case 'Bash': return '▶'
      case 'Read': return '📖'
      default: return '●'
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box gap={2} marginBottom={1}>
        <Badge label="Permissions" color={colors.warning} />
        {pendingCount > 0 ? (
          <Text color={colors.warning} bold>{pendingCount} pending approval</Text>
        ) : (
          <Text color={colors.success}>All resolved</Text>
        )}
      </Box>

      <Sep />

      {/* Action list */}
      <Box flexDirection="column" marginTop={1}>
        {actions.map((action, i) => {
          const selected = i === cursor
          const si = statusIcon(action.status)
          const isExpanded = expanded.has(action.id)
          const isPending = action.status === 'pending'

          return (
            <Box key={action.id} flexDirection="column" marginBottom={isExpanded ? 1 : 0}>
              <Box gap={1}>
                <Text color={selected ? colors.primary : undefined}>
                  {selected ? '▸' : ' '}
                </Text>
                <Text color={si.color} bold>{si.icon}</Text>
                <Text color={riskColor(action.risk)} dimColor={!isPending}>
                  {action.risk === 'high' ? '▲' : action.risk === 'medium' ? '◆' : '◇'}
                </Text>
                <Badge label={action.tool} color={
                  action.tool === 'Bash' ? colors.error
                  : action.tool === 'Write' ? colors.success
                  : colors.info
                } />
                <Text bold={selected || isPending} dimColor={!isPending && !selected}>
                  {action.description}
                </Text>
                {isPending && selected && (
                  <Text dimColor>(y/n)</Text>
                )}
              </Box>

              {/* Expanded details */}
              {isExpanded && (
                <Box flexDirection="column" marginLeft={6}>
                  {action.detail.map((d, di) => (
                    <Box key={di} gap={1}>
                      <Text dimColor>·</Text>
                      <Text dimColor>{d}</Text>
                    </Box>
                  ))}
                  {action.risk === 'high' && action.status === 'pending' && (
                    <Box marginTop={0} gap={1}>
                      <Text color={colors.error} bold>⚠ High risk action</Text>
                      <Text dimColor>— review carefully before approving</Text>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      <Help keys={[
        { key: 'j/k', label: 'navigate' },
        { key: 'y', label: 'approve' },
        { key: 'n', label: 'deny' },
        { key: 'a', label: 'approve all' },
        { key: '⏎', label: 'details' },
        { key: 'r', label: 'reset' },
      ]} />
    </Box>
  )
}
