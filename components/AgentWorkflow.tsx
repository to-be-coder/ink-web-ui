import { useReducer, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

type StepStatus = 'pending' | 'running' | 'done'

interface ThinkingStep {
  type: 'thinking'
  text: string
  status: StepStatus
}

interface ToolStep {
  type: 'tool'
  name: string
  input: string
  output: string
  status: StepStatus
}

interface ResponseStep {
  type: 'response'
  text: string
  streamed: string
  status: StepStatus
}

type Step = ThinkingStep | ToolStep | ResponseStep

interface Workflow {
  query: string
  steps: Step[]
}

const WORKFLOWS: Workflow[] = [
  {
    query: 'What is the weather in San Francisco?',
    steps: [
      { type: 'thinking', text: 'The user wants weather data. I need to call a weather API for San Francisco.', status: 'pending' },
      { type: 'tool', name: 'get_weather', input: '{"city": "San Francisco", "units": "fahrenheit"}', output: '{"temp": 62, "condition": "foggy", "humidity": 78, "wind": "12 mph NW"}', status: 'pending' },
      { type: 'response', text: "It's currently 62°F and foggy in San Francisco with 78% humidity and 12 mph winds from the northwest.", streamed: '', status: 'pending' },
    ],
  },
  {
    query: 'Find recent papers on transformer architectures',
    steps: [
      { type: 'thinking', text: 'I should search for recent academic papers about transformer architectures and summarize the findings.', status: 'pending' },
      { type: 'tool', name: 'search', input: '{"query": "transformer architecture papers 2025", "limit": 3}', output: '{"results": [{"title": "Efficient Attention Mechanisms"}, {"title": "Sparse Transformers at Scale"}, {"title": "Beyond Self-Attention"}]}', status: 'pending' },
      { type: 'tool', name: 'read_document', input: '{"id": "efficient-attention-2025"}', output: '{"abstract": "We propose a linear-time attention mechanism that achieves comparable performance to standard attention while reducing memory usage by 4x..."}', status: 'pending' },
      { type: 'response', text: "I found 3 recent papers. The most notable is \"Efficient Attention Mechanisms\" which proposes a linear-time attention variant with 4x memory reduction while maintaining comparable performance.", streamed: '', status: 'pending' },
    ],
  },
  {
    query: 'Calculate the fibonacci of 10 and check if it is prime',
    steps: [
      { type: 'thinking', text: 'I need to compute fibonacci(10) first, then check if the result is a prime number. Two tool calls needed.', status: 'pending' },
      { type: 'tool', name: 'run_code', input: 'fib(10)', output: '55', status: 'pending' },
      { type: 'tool', name: 'run_code', input: 'is_prime(55)', output: 'False (55 = 5 x 11)', status: 'pending' },
      { type: 'response', text: 'The 10th Fibonacci number is 55, which is not prime. It factors as 5 x 11.', streamed: '', status: 'pending' },
    ],
  },
]

interface State {
  workflow: Workflow
  currentStep: number
  phase: 'idle' | 'running' | 'streaming' | 'done'
  streamIndex: number
}

type Action =
  | { type: 'start' }
  | { type: 'advance' }
  | { type: 'stream_char' }
  | { type: 'finish' }
  | { type: 'reset' }
  | { type: 'next_workflow' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start': {
      const steps = state.workflow.steps.map((s, i) => ({
        ...s,
        status: (i === 0 ? 'running' : 'pending') as StepStatus,
      }))
      return { ...state, workflow: { ...state.workflow, steps }, currentStep: 0, phase: 'running' }
    }
    case 'advance': {
      const next = state.currentStep + 1
      const steps = state.workflow.steps.map((s, i) => {
        if (i === state.currentStep) return { ...s, status: 'done' as StepStatus }
        if (i === next) return { ...s, status: 'running' as StepStatus }
        return s
      })
      const nextStep = steps[next]
      const phase = nextStep?.type === 'response' ? 'streaming' : 'running'
      return { ...state, workflow: { ...state.workflow, steps }, currentStep: next, phase }
    }
    case 'stream_char': {
      const step = state.workflow.steps[state.currentStep]
      if (step?.type !== 'response') return state
      const idx = state.streamIndex
      if (idx >= step.text.length) return state
      const steps = state.workflow.steps.map((s, i) => {
        if (i === state.currentStep && s.type === 'response') {
          return { ...s, streamed: s.streamed + s.text[idx] }
        }
        return s
      })
      return { ...state, workflow: { ...state.workflow, steps }, streamIndex: idx + 1 }
    }
    case 'finish': {
      const steps = state.workflow.steps.map((s) => ({ ...s, status: 'done' as StepStatus }))
      return { ...state, workflow: { ...state.workflow, steps }, phase: 'done' }
    }
    case 'reset': {
      const steps = state.workflow.steps.map((s) => ({
        ...s,
        status: 'pending' as StepStatus,
        ...(s.type === 'response' ? { streamed: '' } : {}),
      }))
      return { ...state, workflow: { ...state.workflow, steps }, currentStep: 0, phase: 'idle', streamIndex: 0 }
    }
    case 'next_workflow': {
      const idx = WORKFLOWS.indexOf(state.workflow)
      const next = WORKFLOWS[(idx + 1) % WORKFLOWS.length]!
      return {
        workflow: { ...next, steps: next.steps.map(s => ({ ...s, status: 'pending' as StepStatus, ...(s.type === 'response' ? { streamed: '' } : {}) })) },
        currentStep: 0,
        phase: 'idle',
        streamIndex: 0,
      }
    }
  }
}

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

function useSpinner(active: boolean) {
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  const frameRef = useRef(0)

  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % SPINNER.length
      forceUpdate()
    }, 80)
    return () => clearInterval(timer)
  }, [active])

  return SPINNER[frameRef.current]!
}

function StatusIcon({ status }: { status: StepStatus }) {
  const colors = useTheme()
  const spinner = useSpinner(status === 'running')
  if (status === 'done') return <Text color={colors.success}>✓</Text>
  if (status === 'running') return <Text color={colors.primary}>{spinner}</Text>
  return <Text dimColor>○</Text>
}

export function AgentWorkflow() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    workflow: WORKFLOWS[0]!,
    currentStep: 0,
    phase: 'idle',
    streamIndex: 0,
  })

  const { workflow, currentStep, phase, streamIndex } = state

  useEffect(() => {
    if (phase === 'running') {
      const step = workflow.steps[currentStep]
      const delay = step?.type === 'thinking' ? 1500 : 1200
      const timer = setTimeout(() => dispatch({ type: 'advance' }), delay)
      return () => clearTimeout(timer)
    }
  }, [phase, currentStep])

  useEffect(() => {
    if (phase !== 'streaming') return
    const step = workflow.steps[currentStep]
    if (step?.type !== 'response') return
    if (streamIndex >= step.text.length) {
      dispatch({ type: 'finish' })
      return
    }
    const timer = setTimeout(() => dispatch({ type: 'stream_char' }), 18)
    return () => clearTimeout(timer)
  }, [phase, streamIndex])

  useInput((ch) => {
    if (ch === ' ' && phase === 'idle') dispatch({ type: 'start' })
    else if (ch === 'r') dispatch({ type: 'reset' })
    else if (ch === 'n') dispatch({ type: 'next_workflow' })
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>Agent</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>query </Text>
        <Text bold>{workflow.query}</Text>
      </Box>

      {workflow.steps.map((step, i) => (
        <Box key={i} flexDirection="column" marginBottom={step.status === 'pending' ? 0 : 0}>
          {step.type === 'thinking' && (
            <Box gap={1}>
              <StatusIcon status={step.status} />
              <Text dimColor>thinking</Text>
              {step.status !== 'pending' && <Text color="gray"> {step.text}</Text>}
            </Box>
          )}

          {step.type === 'tool' && (
            <Box flexDirection="column">
              <Box gap={1}>
                <StatusIcon status={step.status} />
                <Text color={colors.warning}>{step.name}</Text>
                <Text dimColor>{step.input}</Text>
              </Box>
              {step.status === 'done' && (
                <Box marginLeft={2}>
                  <Text color="gray">  → {step.output}</Text>
                </Box>
              )}
            </Box>
          )}

          {step.type === 'response' && step.status !== 'pending' && (
            <Box gap={1}>
              <StatusIcon status={step.status} />
              <Box flexShrink={1}>
                <Text wrap="wrap">{step.status === 'done' ? step.text : step.streamed}</Text>
                {phase === 'streaming' && <Text color="gray">▌</Text>}
              </Box>
            </Box>
          )}
        </Box>
      ))}

      <Box marginTop={1} gap={2}>
        {phase === 'idle' && (
          <Box>
            <Text inverse bold> space </Text>
            <Text dimColor> run</Text>
          </Box>
        )}
        {(phase === 'done' || phase === 'idle') && (
          <>
            <Box>
              <Text inverse bold> n </Text>
              <Text dimColor> next query</Text>
            </Box>
            {phase === 'done' && (
              <Box>
                <Text inverse bold> r </Text>
                <Text dimColor> replay</Text>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
