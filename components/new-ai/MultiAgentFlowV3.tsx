import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from '../theme'
import { Help, blendHex } from './utils'

const FILL_FRAMES = ['○', '◔', '◑', '◕', '●']

/* ── Data ── */

interface Step {
  text: string
  time: string
}

interface Lane {
  agent: string
  steps: Step[]
}

interface Phase {
  label: string
  lanes: Lane[]
}

const FLOW: Phase[] = [
  {
    label: 'Plan',
    lanes: [
      { agent: 'Orchestrator', steps: [
        { text: 'Analyze task requirements', time: '1.4s' },
        { text: 'Assign agents', time: '0.1s' },
      ]},
    ],
  },
  {
    label: 'Research',
    lanes: [
      { agent: 'Researcher', steps: [
        { text: 'Search best practices', time: '2.3s' },
        { text: 'Read auth module', time: '0.4s' },
        { text: 'Write brief', time: '0.8s' },
      ]},
      { agent: 'Coder', steps: [
        { text: 'Read project structure', time: '0.3s' },
        { text: 'Plan changes', time: '1.1s' },
      ]},
    ],
  },
  {
    label: 'Implement',
    lanes: [
      { agent: 'Coder', steps: [
        { text: 'Write passport.ts', time: '1.2s' },
        { text: 'Write routes/oauth.ts', time: '0.9s' },
        { text: 'Edit app.ts', time: '0.4s' },
        { text: 'Write .env.example', time: '0.2s' },
      ]},
    ],
  },
  {
    label: 'Validate',
    lanes: [
      { agent: 'Reviewer', steps: [
        { text: 'Read changed files', time: '0.6s' },
        { text: 'Security review', time: '1.8s' },
      ]},
      { agent: 'Tester', steps: [
        { text: 'Write test cases', time: '1.2s' },
        { text: 'Run suite', time: '2.0s' },
      ]},
    ],
  },
  {
    label: 'Finalize',
    lanes: [
      { agent: 'Orchestrator', steps: [
        { text: 'Merge results', time: '0.6s' },
        { text: 'Final report', time: '0.8s' },
      ]},
    ],
  },
]

// Build a flat timeline of events to animate through
// For parallel lanes, interleave their steps
interface TimelineEvent {
  phaseIdx: number
  laneIdx: number
  stepIdx: number
  runDuration: number // ms to show as "running"
}

function buildTimeline(): TimelineEvent[] {
  const events: TimelineEvent[] = []
  for (let pi = 0; pi < FLOW.length; pi++) {
    const phase = FLOW[pi]!
    if (phase.lanes.length === 1) {
      // Sequential: just queue each step
      for (let si = 0; si < phase.lanes[0]!.steps.length; si++) {
        const dur = parseFloat(phase.lanes[0]!.steps[si]!.time) * 400
        events.push({ phaseIdx: pi, laneIdx: 0, stepIdx: si, runDuration: Math.max(300, dur) })
      }
    } else {
      // Parallel: interleave steps from each lane
      const maxLen = Math.max(...phase.lanes.map(l => l.steps.length))
      for (let si = 0; si < maxLen; si++) {
        for (let li = 0; li < phase.lanes.length; li++) {
          if (si < phase.lanes[li]!.steps.length) {
            const dur = parseFloat(phase.lanes[li]!.steps[si]!.time) * 400
            events.push({ phaseIdx: pi, laneIdx: li, stepIdx: si, runDuration: Math.max(300, dur) })
          }
        }
      }
    }
  }
  return events
}

/* ── Component ── */

export function NewAIMultiAgentFlowV3() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const [runId, setRunId] = useState(0)
  const [frame, setFrame] = useState(0)
  const [expanded, setExpanded] = useState(true)
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)

  // Track status: [phaseIdx][laneIdx][stepIdx] => status
  const [statuses, setStatuses] = useState<('pending' | 'running' | 'done')[][][]>(() =>
    FLOW.map(p => p.lanes.map(l => l.steps.map(() => 'pending')))
  )

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) {
        stdout.write('\x1b[2J\x1b[H')
        setReady(true)
      }
    }, 300)
    return () => {
      mountedRef.current = false
      clearTimeout(id)
    }
  }, [])

  // Spinner frame
  useEffect(() => {
    const id = setInterval(() => {
      if (mountedRef.current) setFrame(f => f + 1)
    }, 250)
    return () => clearInterval(id)
  }, [])

  // Animation
  useEffect(() => {
    const timeline = buildTimeline()
    // Reset everything to pending
    setStatuses(FLOW.map(p => p.lanes.map(l => l.steps.map(() => 'pending'))))
    setExpanded(true)

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 600

    for (const event of timeline) {
      const { phaseIdx, laneIdx, stepIdx, runDuration } = event

      // Set to running
      timers.push(setTimeout(() => {
        if (!mountedRef.current) return
        setStatuses(prev => {
          const next = prev.map(p => p.map(l => [...l]))
          next[phaseIdx]![laneIdx]![stepIdx] = 'running'
          return next
        })
      }, delay))

      // Set to done
      timers.push(setTimeout(() => {
        if (!mountedRef.current) return
        setStatuses(prev => {
          const next = prev.map(p => p.map(l => [...l]))
          next[phaseIdx]![laneIdx]![stepIdx] = 'done'
          return next
        })
      }, delay + runDuration))

      delay += runDuration + 200
    }

    return () => timers.forEach(clearTimeout)
  }, [runId])

  useInput((ch, key) => {
    if (key.return || ch === ' ') setExpanded(e => !e)
    if (ch === 'r') setRunId(n => n + 1)
  })

  if (!ready) return <Box />

  const spin = FILL_FRAMES[frame % FILL_FRAMES.length]

  const getStatus = (pi: number, li: number, si: number) => statuses[pi]?.[li]?.[si] ?? 'pending'

  const allSteps = FLOW.flatMap((p, pi) => p.lanes.flatMap((l, li) => l.steps.map((_, si) => getStatus(pi, li, si))))
  const doneCount = allSteps.filter(s => s === 'done').length
  const totalCount = allSteps.length
  const pct = totalCount > 0 ? doneCount / totalCount : 0

  const phaseState = (pi: number) => {
    const phase = FLOW[pi]!
    const steps = phase.lanes.flatMap((l, li) => l.steps.map((_, si) => getStatus(pi, li, si)))
    if (steps.every(s => s === 'done')) return 'done'
    if (steps.some(s => s === 'running' || s === 'done')) return 'running'
    return 'pending'
  }

  const statusIcon = (status: string) => {
    if (status === 'done') return { ch: '●', color: colors.success }
    if (status === 'running') return { ch: spin!, color: colors.primary }
    return { ch: '○', color: '#444444' }
  }

  const stepIcon = (status: string) => {
    if (status === 'done') return { ch: '✓', color: colors.success }
    if (status === 'running') return { ch: spin!, color: colors.primary }
    return { ch: '·', color: '#444444' }
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Progress */}
      <Box gap={1} marginBottom={1}>
        <Text bold>agents</Text>
        <Text dimColor>{doneCount}/{totalCount}</Text>
        <Text>
          <Text color={blendHex(colors.primary, colors.success, pct)}>
            {'━'.repeat(Math.round(pct * 28))}
          </Text>
          <Text dimColor>{'╌'.repeat(28 - Math.round(pct * 28))}</Text>
        </Text>
        <Text dimColor>{Math.round(pct * 100)}%</Text>
      </Box>

      {/* Flow */}
      {FLOW.map((phase, pi) => {
        const state = phaseState(pi)
        const si = statusIcon(state)
        const isParallel = phase.lanes.length > 1
        const isLast = pi === FLOW.length - 1
        const lineColor = state === 'done' ? colors.success : state === 'running' ? colors.primary : '#444444'

        return (
          <Box key={pi} flexDirection="column">
            {/* Phase header */}
            <Box gap={1}>
              <Text color={si.color}>{si.ch}</Text>
              <Text bold color={si.color}>
                {phase.label}
              </Text>
              {isParallel && <Text dimColor>· parallel</Text>}
            </Box>

            {/* Expanded detail */}
            {expanded && phase.lanes.map((lane, li) => {
              const laneSteps = lane.steps.map((_, si) => getStatus(pi, li, si))
              const laneDone = laneSteps.every(s => s === 'done')
              const laneActive = laneSteps.some(s => s === 'running' || s === 'done')
              const agentColor = laneDone ? colors.success : laneActive ? colors.info : '#444444'

              return (
              <Box key={li} flexDirection="column">
                <Box>
                  <Text color={lineColor}>│</Text>
                </Box>
                <Box gap={1}>
                  <Text color={lineColor}>├╴</Text>
                  <Text color={agentColor} bold={laneActive}>{lane.agent}</Text>
                  {isParallel && <Text dimColor>concurrent</Text>}
                </Box>

                {lane.steps.map((step, stepIdx) => {
                  const status = getStatus(pi, li, stepIdx)
                  const ic = stepIcon(status)
                  return (
                    <Box key={stepIdx} gap={1}>
                      <Text color={lineColor}>│</Text>
                      <Text color={ic.color}>   {ic.ch}</Text>
                      <Text dimColor={status === 'pending'}>
                        {step.text}
                      </Text>
                      {status !== 'pending' && <Text dimColor>{step.time}</Text>}
                    </Box>
                  )
                })}
              </Box>
            )})}

            {/* Collapsed */}
            {!expanded && phase.lanes.map((lane, li) => {
              const done = lane.steps.filter((_, si) => getStatus(pi, li, si) === 'done').length
              return (
                <Box key={li} gap={1}>
                  <Text color={lineColor}>│</Text>
                  <Text dimColor color={si.color}>{lane.agent}</Text>
                  <Text dimColor>{done}/{lane.steps.length}</Text>
                </Box>
              )
            })}

            {/* Connector */}
            {!isLast && (
              <Box>
                <Text color={lineColor}>│</Text>
              </Box>
            )}
          </Box>
        )
      })}

      <Help keys={[
        { key: 'enter', label: 'toggle' },
        { key: 'r', label: 'restart' },
      ]} />
    </Box>
  )
}
