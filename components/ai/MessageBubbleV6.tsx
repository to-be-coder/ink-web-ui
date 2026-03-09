import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from '../theme'
import { SPIN } from './utils'

/* ── Types ── */

interface Step {
  tool: string
  label: string
  duration: string
  status: 'done' | 'running' | 'pending'
}

interface Message {
  role: 'user' | 'assistant'
  text: string
  tokens?: number
  model?: string
  steps?: Step[]
}

/* ── Data ── */

const MESSAGES: Message[] = [
  {
    role: 'user',
    text: 'Explain the difference between concurrency and parallelism',
  },
  {
    role: 'assistant',
    steps: [
      { tool: 'Think', label: 'Analyzing question scope', duration: '0.6s', status: 'done' },
      { tool: 'Search', label: '"concurrency vs parallelism"', duration: '0.4s', status: 'done' },
      { tool: 'Read', label: 'docs/async-patterns.md', duration: '0.3s', status: 'done' },
      { tool: 'Think', label: 'Structuring explanation', duration: '0.5s', status: 'done' },
    ],
    text: "Concurrency is about dealing with many things\nat once. Parallelism is about doing many things\nat once.\n\nA single-core CPU can be concurrent — it\nswitches between tasks rapidly. But it's not\nparallel, because only one instruction runs at\nany given moment.\n\nA multi-core CPU can be both. Each core runs a\ntask simultaneously — that's true parallelism.\n\nPractically:\n\n  `async/await`  concurrent, not parallel\n  `Web Workers`  parallel, separate threads\n  `Promise.all`  concurrent, potentially parallel",
    tokens: 142,
    model: 'opus',
  },
  {
    role: 'user',
    text: 'Give me a real-world analogy',
  },
  {
    role: 'assistant',
    steps: [
      { tool: 'Think', label: 'Finding relatable analogy', duration: '0.4s', status: 'done' },
      { tool: 'Think', label: 'Kitchen metaphor works best', duration: '0.5s', status: 'done' },
    ],
    text: "One chef, three dishes on the stove. She stirs\nthe soup, flips the steak, checks the pasta —\nswitching between them. That's concurrency.\n\nThree chefs, three dishes. Each works on one at\nthe same time. That's parallelism.\n\nThe first kitchen is still fast — the chef never\nwaits idle. But the second is faster for the\nsame total work.",
    tokens: 98,
    model: 'opus',
  },
  {
    role: 'user',
    text: 'When does concurrency beat parallelism?',
  },
  {
    role: 'assistant',
    steps: [
      { tool: 'Think', label: 'I/O-bound vs CPU-bound tradeoffs', duration: '0.5s', status: 'done' },
      { tool: 'Read', label: 'benchmarks/io-vs-cpu.md', duration: '0.3s', status: 'done' },
      { tool: 'Think', label: 'Summarizing practical advice', duration: '0.4s', status: 'done' },
    ],
    text: "When the bottleneck is waiting, not computing.\n\nA web server handling 10k connections doesn't\nneed 10k threads. Most connections are idle —\nwaiting for data, waiting for DB responses. One\nevent loop (concurrency) handles them.\n\nParallelism wins for CPU-bound work: image\nprocessing, data crunching, ML inference —\ntasks where every core stays busy.",
    tokens: 87,
    model: 'opus',
  },
]

/* ── Colors ── */

const BUBBLE_BG = '#141422'
const BORDER_CLR = '#2a2a3e'
const USER_BG = '#1a2a1a'
const USER_BORDER = '#2e4a2e'

/* ── Helpers ── */

function pad(text: string, w: number): string {
  return text.length >= w ? text : text + ' '.repeat(w - text.length)
}

function wrapText(text: string, maxWidth: number): string[] {
  const leadingMatch = text.match(/^(\s*)/)
  const indent = leadingMatch ? leadingMatch[1] : ''
  const content = text.slice(indent.length)
  const words = content.split(' ')
  const lines: string[] = []
  let current = indent
  for (const word of words) {
    if (current.length === indent.length) {
      current += word
    } else if (current.length + 1 + word.length <= maxWidth) {
      current += ' ' + word
    } else {
      lines.push(current)
      current = indent + word
    }
  }
  if (current.length > 0) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function toolColor(tool: string, colors: ReturnType<typeof useTheme>): string {
  switch (tool) {
    case 'Read': return colors.info
    case 'Search': return colors.secondary
    case 'Edit': return colors.success
    case 'Write': return colors.primary
    case 'Bash': return colors.warning
    case 'Think': return colors.primary
    default: return colors.info
  }
}

/* ── Rounded bubble frame ── */

function bubbleTop(w: number, borderColor = BORDER_CLR) {
  return <Text color={borderColor}>{'╭'}{'─'.repeat(w - 2)}{'╮'}</Text>
}

function bubbleBottom(w: number, borderColor = BORDER_CLR) {
  return <Text color={borderColor}>{'╰'}{'─'.repeat(w - 2)}{'╯'}</Text>
}

function bubblePadRow(w: number, bg: string) {
  return (
    <Box width={w}>
      <Text backgroundColor={bg}>{' '.repeat(w)}</Text>
    </Box>
  )
}

function bubbleTextRow(text: string, w: number, bg: string, textColor?: string) {
  return (
    <Box width={w}>
      <Text backgroundColor={bg} color={textColor}>
        {pad(`  ${text}`, w)}
      </Text>
    </Box>
  )
}

/* ── Animation state for steps ── */

interface AnimState {
  visibleMsgs: Message[]
  activeSteps: Step[]
  streaming: boolean
  streamText: string
  streamMsgIdx: number
}

/* ── Component ── */

export function AIMessageBubbleV6() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [frame, setFrame] = useState(0)
  const [state, setState] = useState<AnimState>({
    visibleMsgs: [],
    activeSteps: [],

    streaming: false,
    streamText: '',
    streamMsgIdx: 0,
  })
  const [showSteps, setShowSteps] = useState(true)
  const [runId, setRunId] = useState(0)

  const W = 58

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) { stdout.write('\x1b[2J\x1b[H'); setReady(true) }
    }, 300)
    return () => { mountedRef.current = false; clearTimeout(id) }
  }, [])

  useEffect(() => {
    if (!ready) return
    const id = setInterval(() => { if (mountedRef.current) setFrame(f => f + 1) }, 90)
    return () => clearInterval(id)
  }, [ready])

  // Animation engine
  useEffect(() => {
    if (!ready) return
    setState({
      visibleMsgs: [],
      activeSteps: [],
  
      streaming: false,
      streamText: '',
      streamMsgIdx: 0,
    })

    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 500

    MESSAGES.forEach((msg, i) => {
      if (msg.role === 'user') {
        timers.push(setTimeout(() => {
          if (!mountedRef.current) return
          setState(s => ({ ...s, visibleMsgs: [...s.visibleMsgs, msg] }))
        }, delay))
        delay += 700
      } else {
        // Animate steps one by one
        const steps = msg.steps ?? []
        if (steps.length > 0) {
          // Show step container
          timers.push(setTimeout(() => {
            if (!mountedRef.current) return
            setState(s => ({
              ...s,
              activeSteps: steps.map(st => ({ ...st, status: 'pending' as const })),

            }))
          }, delay))
          delay += 300

          steps.forEach((step, si) => {
            // Set step to running
            timers.push(setTimeout(() => {
              if (!mountedRef.current) return
              setState(s => {
                const updated = s.activeSteps.map((st, idx) => ({
                  ...st,
                  status: idx < si ? 'done' as const : idx === si ? 'running' as const : 'pending' as const,
                }))
                return { ...s, activeSteps: updated }
              })
            }, delay))

            const dur = parseFloat(step.duration) * 600 || 400
            delay += dur

            // Set step to done
            timers.push(setTimeout(() => {
              if (!mountedRef.current) return
              setState(s => {
                const updated = s.activeSteps.map((st, idx) => ({
                  ...st,
                  status: idx <= si ? 'done' as const : st.status,
                }))
                return { ...s, activeSteps: updated }
              })
            }, delay))
            delay += 100
          })

          delay += 200
        }

        // Start streaming text
        timers.push(setTimeout(() => {
          if (!mountedRef.current) return
          setState(s => ({ ...s, streaming: true, streamText: '', streamMsgIdx: i }))
        }, delay))
        delay += 200

        const len = msg.text.length
        for (let c = 0; c <= len; c += 3) {
          timers.push(setTimeout(() => {
            if (!mountedRef.current) return
            setState(s => ({ ...s, streamText: msg.text.slice(0, c) }))
          }, delay + (c / 3) * 16))
        }
        delay += (len / 3) * 16 + 200

        // Finish: add to visible, clear active
        timers.push(setTimeout(() => {
          if (!mountedRef.current) return
          setState(s => ({
            ...s,
            streaming: false,
            streamText: '',
            activeSteps: [],
        
            visibleMsgs: [...s.visibleMsgs, msg],
          }))
        }, delay))
        delay += 500
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [ready, runId])

  useInput((ch) => {
    if (ch === 'r') setRunId(n => n + 1)
    if (ch === 'd') setShowSteps(v => !v)
  })

  if (!ready) return <Box />

  const { visibleMsgs, activeSteps, streaming, streamText } = state
  const spin = SPIN[frame % SPIN.length]
  const currentStream = streaming ? MESSAGES[state.streamMsgIdx] : null

  return (
    <Box flexDirection="column" paddingX={1}>
      {visibleMsgs.map((msg, i) => {
        if (msg.role === 'user') {
          const maxUw = 42
          const innerMax = maxUw - 4
          const lines = wrapText(msg.text, innerMax)
          const longest = Math.max(...lines.map(l => l.length))
          const uw = Math.min(Math.max(longest + 4, 20), maxUw)
          return (
            <Box key={i} marginBottom={1} marginTop={i > 0 ? 1 : 0} justifyContent="flex-end">
              <Box flexDirection="column">
                {bubbleTop(uw, USER_BORDER)}
                {bubblePadRow(uw, USER_BG)}
                {lines.map((line) => bubbleTextRow(line, uw, USER_BG))}
                {bubblePadRow(uw, USER_BG)}
                {bubbleBottom(uw, USER_BORDER)}
              </Box>
            </Box>
          )
        }

        // Assistant message
        const steps = msg.steps ?? []
        const totalDur = steps.reduce((sum, s) => sum + (parseFloat(s.duration) || 0), 0).toFixed(1) + 's'

        return (
          <Box key={i} flexDirection="column" marginBottom={0}>
            {/* Step timeline (completed) */}
            {steps.length > 0 && (
              <Box flexDirection="column" marginBottom={0}>
                {showSteps ? (
                  steps.map((step, si) => (
                    <StepRow key={si} step={step} colors={colors} isLast={si === steps.length - 1} />
                  ))
                ) : (
                  <Text dimColor>{totalDur}</Text>
                )}
              </Box>
            )}

            {/* Bubble */}
            <Box flexDirection="column">
              {bubbleTop(W)}
              {bubblePadRow(W, BUBBLE_BG)}
              {msg.text.split('\n').flatMap((line, li) => {
                if (line.trim() === '') return [<BubbleLine key={li} line="" colors={colors} width={W} />]
                const wrapped = wrapText(line, W - 4)
                return wrapped.map((wl, wi) => (
                  <BubbleLine key={`${li}-${wi}`} line={wl} colors={colors} width={W} />
                ))
              })}
              {bubblePadRow(W, BUBBLE_BG)}
              {bubbleBottom(W)}
            </Box>

            {/* Footer */}
            <Box marginLeft={2} gap={1}>
              {msg.model && <Text dimColor>{msg.model}</Text>}
              {msg.tokens && <Text dimColor>{msg.tokens}t</Text>}
            </Box>
          </Box>
        )
      })}

      {/* Active step timeline (animating) */}
      {activeSteps.length > 0 && showSteps && (
        <Box flexDirection="column" marginBottom={0}>
          {activeSteps.map((step, si) => (
            <StepRow key={si} step={step} colors={colors} spin={spin} isLast={si === activeSteps.length - 1} />
          ))}
        </Box>
      )}
      {activeSteps.length > 0 && !showSteps && (
        <Box>
          <Text dimColor color={colors.secondary}>{spin} working</Text>
        </Box>
      )}

      {/* Streaming bubble */}
      {currentStream && (
        <Box flexDirection="column" marginBottom={0}>
          <Box flexDirection="column">
            {bubbleTop(W)}
            {bubblePadRow(W, BUBBLE_BG)}
            {streamText.split('\n').flatMap((line, li) => {
              if (line.trim() === '') return [(
                <Box key={li} width={W}>
                  <Text backgroundColor={BUBBLE_BG}>{' '.repeat(W)}</Text>
                </Box>
              )]
              return wrapText(line, W - 4).map((wl, wi) => (
                <Box key={`${li}-${wi}`} width={W}>
                  <Text backgroundColor={BUBBLE_BG}>
                    {pad(`  ${wl}`, W)}
                  </Text>
                </Box>
              ))
            })}
            <Box width={W}>
              <Text backgroundColor={BUBBLE_BG}>
                {pad('  ▎', W)}
              </Text>
            </Box>
            {bubblePadRow(W, BUBBLE_BG)}
            {bubbleBottom(W)}
          </Box>
        </Box>
      )}

      {/* Footer keys */}
      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> d </Text>
          <Text dimColor> {showSteps ? 'hide' : 'show'} steps</Text>
        </Box>
        <Box>
          <Text inverse bold> r </Text>
          <Text dimColor> replay</Text>
        </Box>
      </Box>
    </Box>
  )
}

/* ── Step row (matches AgentTimeline V7 status style) ── */

function StepRow({ step, colors, spin, isLast }: {
  step: Step
  colors: ReturnType<typeof useTheme>
  spin?: string
  isLast: boolean
}) {
  const tc = toolColor(step.tool, colors)
  const isPending = step.status === 'pending'

  const statusIcon = step.status === 'done'
    ? { ch: '✓', color: colors.success }
    : step.status === 'running'
      ? { ch: spin ?? '⠋', color: colors.primary }
      : { ch: '·', color: '#555555' }

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={statusIcon.color} bold>{statusIcon.ch}</Text>
        <Text> </Text>
        <Text color={tc} bold dimColor={isPending}>{step.tool}</Text>
        <Text dimColor> {step.label}</Text>
        {step.status === 'done' && step.duration && (
          <Text dimColor> {step.duration}</Text>
        )}
      </Box>
      {/* Continuation pipe */}
      {!isLast && (
        <Box>
          <Text color={statusIcon.color}>│</Text>
        </Box>
      )}
    </Box>
  )
}

/* ── Bubble line renderer ── */

function BubbleLine({ line, colors, width }: { line: string; colors: ReturnType<typeof useTheme>; width: number }) {
  const padded = pad(`  ${line}`, width)

  // Inline code: `something` — render as single padded string with colored spans
  if (line.includes('`') && line.split('`').length >= 3) {
    const prefix = '  '
    const parts = line.split('`')
    const contentLen = prefix.length + line.length
    const trail = Math.max(0, width - contentLen)
    return (
      <Box width={width}>
        <Text backgroundColor={BUBBLE_BG}>
          {prefix}
          {parts.map((p, i) =>
            i % 2 === 1
              ? <Text key={i} color={colors.info}>`{p}`</Text>
              : <Text key={i}>{p}</Text>
          )}
          {' '.repeat(trail)}
        </Text>
      </Box>
    )
  }

  // Indented code-like lines
  if (/^\s{2}\S/.test(line)) {
    return (
      <Box width={width}>
        <Text backgroundColor={BUBBLE_BG} color={colors.secondary}>
          {padded}
        </Text>
      </Box>
    )
  }

  // Empty line
  if (line.trim() === '') {
    return (
      <Box width={width}>
        <Text backgroundColor={BUBBLE_BG}>{' '.repeat(width)}</Text>
      </Box>
    )
  }

  // Regular text
  return (
    <Box width={width}>
      <Text backgroundColor={BUBBLE_BG}>
        {padded}
      </Text>
    </Box>
  )
}
