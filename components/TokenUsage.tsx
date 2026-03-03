import { useReducer, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface ModelConfig {
  name: string
  contextWindow: number
  inputCost: number
  outputCost: number
}

const MODELS: ModelConfig[] = [
  { name: 'Claude Sonnet', contextWindow: 200000, inputCost: 3.0, outputCost: 15.0 },
  { name: 'Claude Haiku', contextWindow: 200000, inputCost: 0.25, outputCost: 1.25 },
  { name: 'GPT-4o', contextWindow: 128000, inputCost: 2.5, outputCost: 10.0 },
  { name: 'GPT-4o mini', contextWindow: 128000, inputCost: 0.15, outputCost: 0.6 },
]

interface TokenBreakdown {
  system: number
  history: number
  context: number
  lastResponse: number
}

interface Request {
  id: number
  inputTokens: number
  outputTokens: number
  cost: number
  latency: number
}

interface State {
  modelIndex: number
  breakdown: TokenBreakdown
  requests: Request[]
  totalInput: number
  totalOutput: number
  totalCost: number
  simulating: boolean
}

type Action =
  | { type: 'next_model' }
  | { type: 'prev_model' }
  | { type: 'simulate' }
  | { type: 'add_request'; request: Request }
  | { type: 'update_breakdown'; breakdown: TokenBreakdown }
  | { type: 'reset' }
  | { type: 'stop' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next_model':
      return { ...state, modelIndex: (state.modelIndex + 1) % MODELS.length }
    case 'prev_model':
      return { ...state, modelIndex: (state.modelIndex - 1 + MODELS.length) % MODELS.length }
    case 'simulate':
      return { ...state, simulating: true }
    case 'stop':
      return { ...state, simulating: false }
    case 'add_request': {
      const r = action.request
      return {
        ...state,
        requests: [...state.requests.slice(-9), r],
        totalInput: state.totalInput + r.inputTokens,
        totalOutput: state.totalOutput + r.outputTokens,
        totalCost: state.totalCost + r.cost,
      }
    }
    case 'update_breakdown':
      return { ...state, breakdown: action.breakdown }
    case 'reset':
      return {
        ...state,
        requests: [],
        totalInput: 0,
        totalOutput: 0,
        totalCost: 0,
        simulating: false,
        breakdown: { system: 800, history: 0, context: 0, lastResponse: 0 },
      }
  }
}

function randomBetween(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min))
}

function formatTokens(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatCost(n: number): string {
  return '$' + n.toFixed(4)
}

function ContextBar({ breakdown, maxTokens }: { breakdown: TokenBreakdown; maxTokens: number }) {
  const colors = useTheme()
  const width = 36
  const total = breakdown.system + breakdown.history + breakdown.context + breakdown.lastResponse
  const pct = Math.min(total / maxTokens, 1)

  const sysW = Math.round((breakdown.system / maxTokens) * width)
  const histW = Math.round((breakdown.history / maxTokens) * width)
  const ctxW = Math.round((breakdown.context / maxTokens) * width)
  const respW = Math.round((breakdown.lastResponse / maxTokens) * width)
  const freeW = Math.max(0, width - sysW - histW - ctxW - respW)

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={colors.secondary}>{'█'.repeat(sysW)}</Text>
        <Text color={colors.info}>{'█'.repeat(histW)}</Text>
        <Text color={colors.primary}>{'█'.repeat(ctxW)}</Text>
        <Text color={colors.success}>{'█'.repeat(respW)}</Text>
        <Text color="gray">{'░'.repeat(freeW)}</Text>
        <Text dimColor> {Math.round(pct * 100)}%</Text>
      </Box>
      <Box gap={2}>
        <Text color={colors.secondary}>■</Text><Text dimColor>system</Text>
        <Text color={colors.info}>■</Text><Text dimColor>history</Text>
        <Text color={colors.primary}>■</Text><Text dimColor>RAG</Text>
        <Text color={colors.success}>■</Text><Text dimColor>response</Text>
      </Box>
    </Box>
  )
}

function CostBar({ current, budget, width = 24 }: { current: number; budget: number; width?: number }) {
  const colors = useTheme()
  const pct = Math.min(current / budget, 1)
  const filled = Math.round(pct * width)
  const color = pct > 0.8 ? colors.error : pct > 0.5 ? colors.warning : colors.success
  return (
    <Box>
      <Text color={color}>{'█'.repeat(filled)}</Text>
      <Text color="gray">{'░'.repeat(width - filled)}</Text>
      <Text dimColor> {formatCost(current)} / {formatCost(budget)}</Text>
    </Box>
  )
}

const SESSION_BUDGET = 0.5

export function TokenUsage() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    modelIndex: 0,
    breakdown: { system: 800, history: 0, context: 0, lastResponse: 0 },
    requests: [],
    totalInput: 0,
    totalOutput: 0,
    totalCost: 0,
    simulating: false,
  })

  const model = MODELS[state.modelIndex]!
  const { breakdown, requests, totalInput, totalOutput, totalCost, simulating } = state

  useEffect(() => {
    if (!simulating) return
    const timer = setInterval(() => {
      const inputTokens = randomBetween(200, 4000)
      const outputTokens = randomBetween(100, 2000)
      const cost = (inputTokens / 1000000) * model.inputCost + (outputTokens / 1000000) * model.outputCost
      const latency = randomBetween(200, 1800)

      dispatch({
        type: 'add_request',
        request: { id: Date.now(), inputTokens, outputTokens, cost, latency },
      })

      const historyGrowth = randomBetween(500, 2000)
      const contextChunk = randomBetween(0, 3000)
      dispatch({
        type: 'update_breakdown',
        breakdown: {
          system: 800,
          history: Math.min(breakdown.history + historyGrowth, model.contextWindow * 0.4),
          context: contextChunk,
          lastResponse: outputTokens,
        },
      })
    }, 2000)
    return () => clearInterval(timer)
  }, [simulating, model, breakdown.history])

  useInput((ch, key) => {
    if (ch === ' ') {
      if (simulating) dispatch({ type: 'stop' })
      else dispatch({ type: 'simulate' })
    } else if (key.leftArrow || ch === 'h') dispatch({ type: 'prev_model' })
    else if (key.rightArrow || ch === 'l') dispatch({ type: 'next_model' })
    else if (ch === 'r') dispatch({ type: 'reset' })
  })

  const usedTokens = breakdown.system + breakdown.history + breakdown.context + breakdown.lastResponse

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Token Usage</Text>
        <Text bold>{model.name}</Text>
        {simulating && <Text color={colors.success}>live</Text>}
      </Box>

      <Text dimColor>Context Window</Text>
      <ContextBar breakdown={breakdown} maxTokens={model.contextWindow} />
      <Text dimColor>{formatTokens(usedTokens)} / {formatTokens(model.contextWindow)} tokens</Text>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Session Budget</Text>
        <CostBar current={totalCost} budget={SESSION_BUDGET} />
      </Box>

      <Box marginTop={1} gap={4}>
        <Box flexDirection="column">
          <Text dimColor>Input  {formatTokens(totalInput)} tokens</Text>
          <Text dimColor>Output {formatTokens(totalOutput)} tokens</Text>
        </Box>
        <Box flexDirection="column">
          <Text dimColor>Requests {requests.length}</Text>
          <Text dimColor>Avg latency {requests.length > 0 ? Math.round(requests.reduce((s, r) => s + r.latency, 0) / requests.length) : 0}ms</Text>
        </Box>
      </Box>

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> space </Text>
          <Text dimColor> {simulating ? 'stop' : 'simulate'}</Text>
        </Box>
        <Box>
          <Text inverse bold> ←→ </Text>
          <Text dimColor> model</Text>
        </Box>
        <Box>
          <Text inverse bold> r </Text>
          <Text dimColor> reset</Text>
        </Box>
      </Box>
    </Box>
  )
}
