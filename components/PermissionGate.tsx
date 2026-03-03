import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

type ActionType = 'file_edit' | 'file_create' | 'shell' | 'api_call' | 'file_delete'
type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
type Decision = 'pending' | 'allowed' | 'denied' | 'always_allow'

interface PermissionRequest {
  id: number
  actionType: ActionType
  description: string
  resource: string
  detail?: string
  risk: RiskLevel
  decision: Decision
}

interface State {
  requests: PermissionRequest[]
  cursor: number
  historyMode: boolean
  demoIndex: number
}

type Action =
  | { type: 'allow' }
  | { type: 'deny' }
  | { type: 'always_allow' }
  | { type: 'next_request' }
  | { type: 'toggle_history' }
  | { type: 'move_up' }
  | { type: 'move_down' }
  | { type: 'reset' }

const DEMO_REQUESTS: Omit<PermissionRequest, 'id' | 'decision'>[] = [
  {
    actionType: 'file_edit',
    description: 'Edit file',
    resource: 'src/auth.ts',
    detail: '+12 -1 lines (add rate limiting)',
    risk: 'medium',
  },
  {
    actionType: 'shell',
    description: 'Run command',
    resource: 'npm test -- --filter auth',
    detail: 'Execute test suite for auth module',
    risk: 'low',
  },
  {
    actionType: 'file_create',
    description: 'Create file',
    resource: 'src/middleware/rateLimit.ts',
    detail: 'New file: sliding window rate limiter (48 lines)',
    risk: 'low',
  },
  {
    actionType: 'shell',
    description: 'Run command',
    resource: 'rm -rf node_modules && npm install',
    detail: 'Delete and reinstall all dependencies',
    risk: 'high',
  },
  {
    actionType: 'api_call',
    description: 'HTTP request',
    resource: 'POST https://api.example.com/deploy',
    detail: 'Trigger production deployment',
    risk: 'critical',
  },
  {
    actionType: 'file_delete',
    description: 'Delete file',
    resource: 'src/legacy/oldAuth.ts',
    detail: 'Remove deprecated authentication module',
    risk: 'medium',
  },
  {
    actionType: 'file_edit',
    description: 'Edit file',
    resource: '.env',
    detail: 'Modify environment variables (contains secrets)',
    risk: 'critical',
  },
  {
    actionType: 'shell',
    description: 'Run command',
    resource: 'git push origin main --force',
    detail: 'Force push to main branch',
    risk: 'critical',
  },
]

function reducer(state: State, action: Action): State {
  const pendingIdx = state.requests.findIndex(r => r.decision === 'pending')

  switch (action.type) {
    case 'allow': {
      if (pendingIdx === -1) return state
      const requests = [...state.requests]
      requests[pendingIdx] = { ...requests[pendingIdx]!, decision: 'allowed' }
      return { ...state, requests }
    }
    case 'deny': {
      if (pendingIdx === -1) return state
      const requests = [...state.requests]
      requests[pendingIdx] = { ...requests[pendingIdx]!, decision: 'denied' }
      return { ...state, requests }
    }
    case 'always_allow': {
      if (pendingIdx === -1) return state
      const requests = [...state.requests]
      requests[pendingIdx] = { ...requests[pendingIdx]!, decision: 'always_allow' }
      return { ...state, requests }
    }
    case 'next_request': {
      if (state.demoIndex >= DEMO_REQUESTS.length) return state
      const template = DEMO_REQUESTS[state.demoIndex]!
      const request: PermissionRequest = {
        ...template,
        id: state.demoIndex,
        decision: 'pending',
      }
      return {
        ...state,
        requests: [...state.requests, request],
        demoIndex: state.demoIndex + 1,
      }
    }
    case 'toggle_history':
      return { ...state, historyMode: !state.historyMode, cursor: 0 }
    case 'move_up':
      return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'move_down': {
      const decided = state.requests.filter(r => r.decision !== 'pending')
      return { ...state, cursor: Math.min(decided.length - 1, state.cursor + 1) }
    }
    case 'reset':
      return { requests: [], cursor: 0, historyMode: false, demoIndex: 0 }
  }
}

const ACTION_ICONS: Record<ActionType, string> = {
  file_edit: 'EDIT',
  file_create: 'NEW',
  file_delete: 'DEL',
  shell: 'EXEC',
  api_call: 'HTTP',
}

function getActionColors(colors: ReturnType<typeof useTheme>): Record<ActionType, string> {
  return {
    file_edit: colors.info,
    file_create: colors.success,
    file_delete: colors.error,
    shell: colors.warning,
    api_call: colors.secondary,
  }
}

function getRiskColors(colors: ReturnType<typeof useTheme>): Record<RiskLevel, string> {
  return {
    low: colors.success,
    medium: colors.warning,
    high: colors.error,
    critical: colors.error,
  }
}

function getDecisionLabels(colors: ReturnType<typeof useTheme>): Record<Decision, { label: string; color: string }> {
  return {
    pending: { label: 'PENDING', color: colors.warning },
    allowed: { label: 'ALLOWED', color: colors.success },
    denied: { label: 'DENIED', color: colors.error },
    always_allow: { label: 'ALWAYS', color: colors.primary },
  }
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const colors = useTheme()
  const RISK_COLORS = getRiskColors(colors)
  return (
    <Text color={RISK_COLORS[risk]} bold={risk === 'critical'} inverse={risk === 'critical'}>
      {risk === 'critical' ? ` ${risk.toUpperCase()} ` : risk}
    </Text>
  )
}

function PendingPrompt({ request }: { request: PermissionRequest }) {
  const colors = useTheme()
  const ACTION_COLORS = getActionColors(colors)
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1} marginBottom={1}>
        <Text color={ACTION_COLORS[request.actionType]} bold>
          [{ACTION_ICONS[request.actionType]}]
        </Text>
        <Text bold>{request.description}</Text>
        <RiskBadge risk={request.risk} />
      </Box>

      <Box marginLeft={2} flexDirection="column">
        <Box gap={1}>
          <Text dimColor>Resource:</Text>
          <Text bold>{request.resource}</Text>
        </Box>
        {request.detail && (
          <Box gap={1}>
            <Text dimColor>Detail:</Text>
            <Text>{request.detail}</Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1} gap={3}>
        <Box>
          <Text inverse bold color={colors.success}> y </Text>
          <Text> allow</Text>
        </Box>
        <Box>
          <Text inverse bold color={colors.error}> n </Text>
          <Text> deny</Text>
        </Box>
        <Box>
          <Text inverse bold color={colors.primary}> a </Text>
          <Text> always allow</Text>
        </Box>
      </Box>
    </Box>
  )
}

function HistoryRow({ request, active }: { request: PermissionRequest; active: boolean }) {
  const colors = useTheme()
  const ACTION_COLORS = getActionColors(colors)
  const DECISION_LABELS = getDecisionLabels(colors)
  const dec = DECISION_LABELS[request.decision]
  return (
    <Box gap={1}>
      <Text color={active ? 'black' : ACTION_COLORS[request.actionType]}
        backgroundColor={active ? 'white' : undefined}
        bold={active}>
        [{ACTION_ICONS[request.actionType]}]
      </Text>
      <Text color={active ? 'black' : undefined}
        backgroundColor={active ? 'white' : undefined}>
        {request.resource.padEnd(32)}
      </Text>
      <RiskBadge risk={request.risk} />
      <Text color={dec.color} bold> {dec.label}</Text>
    </Box>
  )
}

export function PermissionGate() {
  const colors = useTheme()
  const DECISION_LABELS = getDecisionLabels(colors)
  const [state, dispatch] = useReducer(reducer, {
    requests: [],
    cursor: 0,
    historyMode: false,
    demoIndex: 0,
  })

  const { requests, cursor, historyMode, demoIndex } = state
  const pending = requests.find(r => r.decision === 'pending')
  const decided = requests.filter(r => r.decision !== 'pending')
  const allowed = decided.filter(r => r.decision === 'allowed' || r.decision === 'always_allow').length
  const denied = decided.filter(r => r.decision === 'denied').length

  useInput((ch, key) => {
    if (historyMode) {
      if (key.escape || key.tab) dispatch({ type: 'toggle_history' })
      else if (ch === 'j' || key.downArrow) dispatch({ type: 'move_down' })
      else if (ch === 'k' || key.upArrow) dispatch({ type: 'move_up' })
      return
    }

    if (pending) {
      if (ch === 'y') dispatch({ type: 'allow' })
      else if (ch === 'n') dispatch({ type: 'deny' })
      else if (ch === 'a') dispatch({ type: 'always_allow' })
    } else {
      if (ch === ' ' && demoIndex < DEMO_REQUESTS.length) dispatch({ type: 'next_request' })
    }

    if (key.tab && decided.length > 0) dispatch({ type: 'toggle_history' })
    else if (ch === 'r') dispatch({ type: 'reset' })
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Permission Gate</Text>
        {decided.length > 0 && (
          <>
            <Text color={colors.success}>{allowed} allowed</Text>
            <Text color={colors.error}>{denied} denied</Text>
          </>
        )}
        {demoIndex >= DEMO_REQUESTS.length && !pending && (
          <Text dimColor>all reviewed</Text>
        )}
      </Box>

      {historyMode ? (
        <Box flexDirection="column">
          <Box marginBottom={1}><Text dimColor>Decision History</Text></Box>
          {decided.map((r, i) => (
            <HistoryRow key={r.id} request={r} active={i === cursor} />
          ))}
        </Box>
      ) : pending ? (
        <PendingPrompt request={pending} />
      ) : (
        <Box flexDirection="column" marginBottom={1}>
          {demoIndex < DEMO_REQUESTS.length ? (
            <Text dimColor>  Press space to trigger the next permission request.</Text>
          ) : (
            <Text dimColor>  All {DEMO_REQUESTS.length} requests reviewed. Press tab to view history.</Text>
          )}
        </Box>
      )}

      {!historyMode && decided.length > 0 && decided.length <= 4 && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>Recent:</Text>
          {decided.slice(-3).map(r => {
            const dec = DECISION_LABELS[r.decision]
            return (
              <Box key={r.id} gap={1} marginLeft={1}>
                <Text color={dec.color}>{dec.label.padEnd(7)}</Text>
                <Text dimColor>{r.resource}</Text>
              </Box>
            )
          })}
        </Box>
      )}

      <Box marginTop={1} gap={2}>
        {!pending && demoIndex < DEMO_REQUESTS.length && !historyMode && (
          <Box>
            <Text inverse bold> space </Text>
            <Text dimColor> next</Text>
          </Box>
        )}
        {decided.length > 0 && (
          <Box>
            <Text inverse bold> tab </Text>
            <Text dimColor> {historyMode ? 'back' : 'history'}</Text>
          </Box>
        )}
        <Box>
          <Text inverse bold> r </Text>
          <Text dimColor> reset</Text>
        </Box>
      </Box>
    </Box>
  )
}
