import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep, SPIN, MiniBar, blendHex } from './utils'

interface Step {
  id: string
  label: string
  tool?: string
  status: 'done' | 'running' | 'pending' | 'error'
  duration?: string
  children?: Step[]
  output?: string
}

const TIMELINE: Step[] = [
  {
    id: '1', label: 'Analyze codebase', status: 'done', duration: '1.2s',
    tool: 'Read',
    children: [
      { id: '1a', label: 'Read package.json', status: 'done', duration: '0.1s', tool: 'Read', output: '{ "name": "my-app", "version": "1.0.0" }' },
      { id: '1b', label: 'Read tsconfig.json', status: 'done', duration: '0.1s', tool: 'Read', output: '{ "compilerOptions": { "strict": true } }' },
      { id: '1c', label: 'Scan src/ directory', status: 'done', duration: '0.3s', tool: 'Glob', output: 'Found 23 TypeScript files' },
    ],
  },
  {
    id: '2', label: 'Plan implementation', status: 'done', duration: '2.1s',
    tool: 'Think',
    output: 'Strategy: Add auth middleware, create user routes, update types',
  },
  {
    id: '3', label: 'Create auth module', status: 'done', duration: '0.8s',
    tool: 'Write',
    children: [
      { id: '3a', label: 'Write src/auth.ts', status: 'done', duration: '0.3s', tool: 'Write', output: 'Created 42-line auth module' },
      { id: '3b', label: 'Write src/types.ts', status: 'done', duration: '0.2s', tool: 'Write', output: 'Added User and AuthPayload interfaces' },
    ],
  },
  {
    id: '4', label: 'Update routes', status: 'running', duration: '0.4s',
    tool: 'Edit',
    children: [
      { id: '4a', label: 'Edit src/routes.ts', status: 'done', duration: '0.2s', tool: 'Edit', output: 'Added requireAuth middleware' },
      { id: '4b', label: 'Edit src/app.ts', status: 'running', tool: 'Edit' },
    ],
  },
  {
    id: '5', label: 'Run tests', status: 'pending',
    tool: 'Bash',
  },
  {
    id: '6', label: 'Verify and report', status: 'pending',
    tool: 'Think',
  },
]

export function NewAIAgentTimeline() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['3', '4']))
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  // Flatten for navigation
  const flat: { step: Step; depth: number; parent?: string }[] = []
  for (const step of TIMELINE) {
    flat.push({ step, depth: 0 })
    if (expanded.has(step.id) && step.children) {
      for (const child of step.children) {
        flat.push({ step: child, depth: 1, parent: step.id })
      }
    }
  }

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(flat.length - 1, c + 1))
    if (key.return || ch === ' ') {
      const item = flat[cursor]!
      if (item.step.children) {
        setExpanded(s => {
          const next = new Set(s)
          if (next.has(item.step.id)) next.delete(item.step.id)
          else next.add(item.step.id)
          return next
        })
      }
    }
  })

  const statusIcon = (status: Step['status']) => {
    switch (status) {
      case 'done': return { icon: '✓', color: colors.success }
      case 'running': return { icon: SPIN[frame % SPIN.length]!, color: colors.primary }
      case 'pending': return { icon: '○', color: undefined }
      case 'error': return { icon: '✗', color: colors.error }
    }
  }

  const toolColor = (tool?: string) => {
    switch (tool) {
      case 'Read': return colors.info
      case 'Write': return colors.success
      case 'Edit': return colors.warning
      case 'Bash': return colors.error
      case 'Glob': return colors.secondary
      case 'Think': return colors.primary
      default: return colors.secondary
    }
  }

  const doneCount = TIMELINE.filter(s => s.status === 'done').length
  const totalCount = TIMELINE.length

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box gap={2} marginBottom={1}>
        <Badge label="Agent" color={colors.primary} />
        <Text dimColor>Steps</Text>
        <Text bold color={colors.success}>{doneCount}</Text>
        <Text dimColor>/</Text>
        <Text>{totalCount}</Text>
        <Box>
          <Text color={colors.success}>{'█'.repeat(Math.round((doneCount / totalCount) * 16))}</Text>
          <Text dimColor>{'░'.repeat(16 - Math.round((doneCount / totalCount) * 16))}</Text>
        </Box>
      </Box>

      {/* Timeline */}
      {flat.map((item, i) => {
        const { step, depth } = item
        const selected = i === cursor
        const si = statusIcon(step.status)
        const isLast = depth === 0 && step.id === TIMELINE[TIMELINE.length - 1]!.id
        const hasChildren = step.children && step.children.length > 0
        const isExpanded = expanded.has(step.id)
        const indent = depth * 4

        return (
          <Box key={step.id} flexDirection="column">
            <Box>
              {/* Indent */}
              {indent > 0 && <Text dimColor>{'  │ '}</Text>}

              {/* Tree connector */}
              {depth === 0 ? (
                <Text dimColor>{isLast ? '  └─' : '  ├─'}</Text>
              ) : (
                <Text dimColor>{step === TIMELINE.find(t => t.id === item.parent)?.children?.slice(-1)[0] ? '└─' : '├─'}</Text>
              )}

              {/* Status icon */}
              <Text color={si.color} bold> {si.icon} </Text>

              {/* Selection marker */}
              <Text color={selected ? colors.primary : undefined}>
                {selected ? '▸' : ' '}
              </Text>

              {/* Label */}
              <Text bold={selected}>{step.label}</Text>

              {/* Tool badge */}
              {step.tool && (
                <Text color={toolColor(step.tool)} dimColor={!selected}> [{step.tool}]</Text>
              )}

              {/* Duration */}
              {step.duration && <Text dimColor> {step.duration}</Text>}

              {/* Expand indicator */}
              {hasChildren && (
                <Text color={colors.primary}> {isExpanded ? '▾' : '▸'} {step.children!.length}</Text>
              )}
            </Box>

            {/* Output preview for selected item */}
            {selected && step.output && (
              <Box marginLeft={indent + 8}>
                <Text dimColor color={colors.info}>↳ {step.output}</Text>
              </Box>
            )}
          </Box>
        )
      })}

      <Help keys={[
        { key: 'j/k', label: 'navigate' },
        { key: '⏎', label: 'expand' },
      ]} />
    </Box>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   VARIATION 2 — Horizontal swim lanes with time ruler
   Each step is a horizontal bar sized by duration, stacked vertically
   ═══════════════════════════════════════════════════════════════════════════ */

const LANE_STEPS: { label: string; tool: string; start: number; end: number; status: Step['status']; output?: string }[] = [
  { label: 'Read package.json', tool: 'Read', start: 0, end: 2, status: 'done' },
  { label: 'Read tsconfig.json', tool: 'Read', start: 0, end: 2, status: 'done' },
  { label: 'Scan src/', tool: 'Glob', start: 1, end: 5, status: 'done' },
  { label: 'Plan implementation', tool: 'Think', start: 5, end: 12, status: 'done', output: 'Auth middleware + routes' },
  { label: 'Write src/auth.ts', tool: 'Write', start: 12, end: 16, status: 'done' },
  { label: 'Write src/types.ts', tool: 'Write', start: 13, end: 15, status: 'done' },
  { label: 'Edit src/routes.ts', tool: 'Edit', start: 16, end: 19, status: 'done' },
  { label: 'Edit src/app.ts', tool: 'Edit', start: 18, end: 22, status: 'running' },
  { label: 'Run tests', tool: 'Bash', start: 22, end: 28, status: 'pending' },
  { label: 'Verify & report', tool: 'Think', start: 28, end: 32, status: 'pending' },
]

export function NewAIAgentTimelineV2() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [frame, setFrame] = useState(0)
  const maxTime = 32
  const barScale = 40

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(LANE_STEPS.length - 1, c + 1))
  })

  const toolColor = (tool: string) => {
    switch (tool) {
      case 'Read': return colors.info
      case 'Write': return colors.success
      case 'Edit': return colors.warning
      case 'Bash': return colors.error
      case 'Glob': return colors.secondary
      case 'Think': return colors.primary
      default: return colors.secondary
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={2} marginBottom={1}>
        <Badge label="Swim Lanes" color={colors.info} />
        <Text dimColor>Parallel execution view</Text>
      </Box>

      {/* Time ruler */}
      <Box marginLeft={22}>
        {Array.from({ length: 9 }, (_, i) => (
          <Box key={i} width={5}>
            <Text dimColor>{(i * 4).toString().padStart(2)}s</Text>
          </Box>
        ))}
      </Box>
      <Box marginLeft={22}>
        <Text dimColor>{'┬' + '····┬'.repeat(7) + '····┤'}</Text>
      </Box>

      {/* Lanes */}
      {LANE_STEPS.map((step, i) => {
        const selected = i === cursor
        const col = toolColor(step.tool)
        const leadingSpace = Math.round((step.start / maxTime) * barScale)
        const barWidth = Math.max(1, Math.round(((step.end - step.start) / maxTime) * barScale))
        const statusChar = step.status === 'done' ? '█'
          : step.status === 'running' ? '▓'
          : '░'
        const isPending = step.status === 'pending'

        return (
          <Box key={i}>
            <Text color={selected ? colors.primary : undefined}>
              {selected ? '▸' : ' '}
            </Text>
            <Box width={20}>
              <Text bold={selected} dimColor={isPending} wrap="truncate-end">
                {step.label}
              </Text>
            </Box>
            <Text> </Text>
            <Text dimColor>{' '.repeat(leadingSpace)}</Text>
            <Text color={isPending ? undefined : col} dimColor={isPending}>
              {step.status === 'running'
                ? '█'.repeat(barWidth - 1) + SPIN[frame % SPIN.length]
                : statusChar.repeat(barWidth)}
            </Text>
          </Box>
        )
      })}

      {/* Selected detail */}
      {LANE_STEPS[cursor]!.output && (
        <Box marginTop={1} marginLeft={2} gap={1}>
          <Text dimColor color={colors.info}>↳</Text>
          <Text dimColor>{LANE_STEPS[cursor]!.output}</Text>
        </Box>
      )}

      <Help keys={[{ key: 'j/k', label: 'navigate' }]} />
    </Box>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   VARIATION 3 — Minimal card stack
   Each step is a bordered card, active one is highlighted
   ═══════════════════════════════════════════════════════════════════════════ */

export function NewAIAgentTimelineV3() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(3)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(TIMELINE.length - 1, c + 1))
  })

  const toolColor = (tool?: string) => {
    switch (tool) {
      case 'Read': return colors.info
      case 'Write': return colors.success
      case 'Edit': return colors.warning
      case 'Bash': return colors.error
      case 'Glob': return colors.secondary
      case 'Think': return colors.primary
      default: return colors.secondary
    }
  }

  const statusLine = (s: Step) => {
    switch (s.status) {
      case 'done': return { icon: '✓ Complete', color: colors.success }
      case 'running': return { icon: SPIN[frame % SPIN.length]! + ' Running', color: colors.primary }
      case 'pending': return { icon: '◌ Waiting', color: undefined }
      case 'error': return { icon: '✗ Failed', color: colors.error }
    }
  }

  const doneCount = TIMELINE.filter(s => s.status === 'done').length

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={2} marginBottom={1}>
        <Badge label="Cards" color={colors.secondary} />
        <Text dimColor>{doneCount}/{TIMELINE.length} complete</Text>
      </Box>

      {TIMELINE.map((step, i) => {
        const selected = i === cursor
        const sl = statusLine(step)
        const col = toolColor(step.tool)
        const isPending = step.status === 'pending'

        return (
          <Box
            key={step.id}
            flexDirection="column"
            borderStyle={selected ? 'round' : 'single'}
            borderColor={selected ? col : isPending ? '#333333' : '#555555'}
            paddingLeft={1}
            paddingRight={1}
            marginBottom={0}
          >
            <Box justifyContent="space-between">
              <Box gap={1}>
                <Text bold color={col} dimColor={isPending}>
                  {step.tool}
                </Text>
                <Text bold={selected} dimColor={isPending}>
                  {step.label}
                </Text>
              </Box>
              <Box gap={1}>
                {step.duration && <Text dimColor>{step.duration}</Text>}
                <Text color={sl.color} dimColor={isPending}>{sl.icon}</Text>
              </Box>
            </Box>

            {/* Show children inline if selected */}
            {selected && step.children && (
              <Box flexDirection="column" marginTop={0}>
                {step.children.map(child => {
                  const csl = statusLine(child)
                  return (
                    <Box key={child.id} gap={1}>
                      <Text color={csl.color} dimColor={child.status === 'pending'}>
                        {child.status === 'done' ? '  ✓' : child.status === 'running' ? '  ' + SPIN[frame % SPIN.length] : '  ◌'}
                      </Text>
                      <Text dimColor={child.status === 'pending'}>{child.label}</Text>
                      {child.duration && <Text dimColor>{child.duration}</Text>}
                    </Box>
                  )
                })}
              </Box>
            )}

            {selected && step.output && !step.children && (
              <Text dimColor color={colors.info}>  ↳ {step.output}</Text>
            )}
          </Box>
        )
      })}

      <Help keys={[{ key: 'j/k', label: 'navigate' }]} />
    </Box>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   VARIATION 4 — Vertical pipe with elapsed time gutter
   Clean left-aligned timeline with a continuous pipe, time on the left
   ═══════════════════════════════════════════════════════════════════════════ */

export function NewAIAgentTimelineV4() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [frame, setFrame] = useState(0)
  const [showOutput, setShowOutput] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  // Flatten everything — always show children
  const flat: { step: Step; depth: number; elapsed: string }[] = []
  let elapsed = 0
  for (const step of TIMELINE) {
    flat.push({ step, depth: 0, elapsed: elapsed.toFixed(1) + 's' })
    if (step.children) {
      for (const child of step.children) {
        const d = parseFloat(child.duration ?? '0')
        flat.push({ step: child, depth: 1, elapsed: elapsed.toFixed(1) + 's' })
        elapsed += d
      }
    } else {
      elapsed += parseFloat(step.duration ?? '0')
    }
  }

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(flat.length - 1, c + 1))
    if (ch === 'o') setShowOutput(o => !o)
  })

  const statusDot = (status: Step['status']) => {
    switch (status) {
      case 'done': return { ch: '●', color: colors.success }
      case 'running': return { ch: '●', color: colors.primary }
      case 'pending': return { ch: '○', color: '#555555' }
      case 'error': return { ch: '●', color: colors.error }
    }
  }

  const toolColor = (tool?: string) => {
    switch (tool) {
      case 'Read': return colors.info
      case 'Write': return colors.success
      case 'Edit': return colors.warning
      case 'Bash': return colors.error
      case 'Glob': return colors.secondary
      case 'Think': return colors.primary
      default: return colors.secondary
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={2} marginBottom={1}>
        <Badge label="Pipe" color={colors.primary} />
        <Text dimColor>Elapsed time view</Text>
      </Box>

      {flat.map((item, i) => {
        const { step, depth, elapsed: el } = item
        const selected = i === cursor
        const sd = statusDot(step.status)
        const isLast = i === flat.length - 1
        const isPending = step.status === 'pending'
        const pipeChar = isLast ? ' ' : '│'

        return (
          <Box key={step.id + i} flexDirection="column">
            <Box>
              {/* Time gutter */}
              <Box width={7}>
                <Text dimColor={!selected} color={selected ? colors.primary : undefined}>
                  {depth === 0 ? el.padStart(5) : '     '}
                </Text>
              </Box>

              {/* Pipe */}
              <Text color={sd.color}>
                {depth > 0 ? '  ' : ''}
                {step.status === 'running' ? SPIN[frame % SPIN.length] : sd.ch}
              </Text>
              <Text dimColor>{depth > 0 ? '' : ''} </Text>

              {/* Content */}
              <Text bold={selected && depth === 0} dimColor={isPending}>
                {step.label}
              </Text>

              {step.tool && (
                <Text color={toolColor(step.tool)} dimColor={!selected}> {step.tool}</Text>
              )}

              {step.duration && depth > 0 && (
                <Text dimColor> {step.duration}</Text>
              )}
            </Box>

            {/* Output */}
            {showOutput && selected && step.output && (
              <Box>
                <Box width={7}><Text> </Text></Box>
                <Text dimColor>{depth > 0 ? '  ' : ''}  </Text>
                <Text dimColor color={colors.info}>{step.output}</Text>
              </Box>
            )}

            {/* Continuation pipe */}
            {!isLast && depth === 0 && (
              <Box>
                <Box width={7}><Text> </Text></Box>
                <Text dimColor>│</Text>
              </Box>
            )}
          </Box>
        )
      })}

      <Help keys={[
        { key: 'j/k', label: 'navigate' },
        { key: 'o', label: 'output' },
      ]} />
    </Box>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   VARIATION 5 — Compact inline / single-line per step
   Ultra-dense view — each step on one line, progress dots on the right
   ═══════════════════════════════════════════════════════════════════════════ */

export function NewAIAgentTimelineV5() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(TIMELINE.length - 1, c + 1))
  })

  const doneCount = TIMELINE.filter(s => s.status === 'done').length

  // Progress dots
  const dots = TIMELINE.map(s => {
    switch (s.status) {
      case 'done': return { ch: '●', color: colors.success }
      case 'running': return { ch: '◉', color: colors.primary }
      case 'pending': return { ch: '○', color: '#555555' }
      case 'error': return { ch: '●', color: colors.error }
    }
  })

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header with dot progress */}
      <Box gap={2} marginBottom={1}>
        <Badge label="Compact" color={colors.warning} />
        <Box gap={1}>
          {dots.map((d, i) => (
            <Text key={i} color={d.color} bold={i === cursor}>{d.ch}</Text>
          ))}
        </Box>
        <Text dimColor>{doneCount}/{TIMELINE.length}</Text>
      </Box>

      <Sep />

      {TIMELINE.map((step, i) => {
        const selected = i === cursor
        const isPending = step.status === 'pending'
        const isRunning = step.status === 'running'
        const isDone = step.status === 'done'

        const toolColors: Record<string, string> = {
          Read: colors.info, Write: colors.success, Edit: colors.warning,
          Bash: colors.error, Glob: colors.secondary, Think: colors.primary,
        }
        const tc = step.tool ? toolColors[step.tool] ?? colors.secondary : colors.secondary

        return (
          <Box key={step.id} flexDirection="column">
            <Box gap={1}>
              {/* Step number */}
              <Text color={isDone ? colors.success : isRunning ? colors.primary : undefined} dimColor={isPending} bold>
                {isDone ? '✓' : isRunning ? SPIN[frame % SPIN.length] : '·'}
              </Text>

              {/* Selector */}
              <Text color={selected ? colors.primary : undefined}>
                {selected ? '▸' : ' '}
              </Text>

              {/* Tool (fixed width) */}
              <Box width={6}>
                <Text color={tc} dimColor={isPending} bold={selected}>
                  {(step.tool ?? '').padEnd(5)}
                </Text>
              </Box>

              {/* Label */}
              <Box width={22}>
                <Text bold={selected} dimColor={isPending} wrap="truncate-end">
                  {step.label}
                </Text>
              </Box>

              {/* Duration bar */}
              <Box width={12}>
                {step.duration ? (
                  <Text>
                    <Text color={tc} dimColor={!selected}>
                      {'▪'.repeat(Math.max(1, Math.round(parseFloat(step.duration) * 3)))}
                    </Text>
                    <Text dimColor> {step.duration}</Text>
                  </Text>
                ) : (
                  <Text dimColor>{'·'.repeat(6)}</Text>
                )}
              </Box>

              {/* Sub-step count */}
              {step.children && (
                <Text dimColor>{step.children.length} sub</Text>
              )}
            </Box>

            {/* Expanded sub-steps for selected */}
            {selected && step.children && step.children.map(child => (
              <Box key={child.id} gap={1} marginLeft={3}>
                <Text color={child.status === 'done' ? colors.success : child.status === 'running' ? colors.primary : undefined} dimColor={child.status === 'pending'}>
                  {child.status === 'done' ? '✓' : child.status === 'running' ? SPIN[frame % SPIN.length] : '·'}
                </Text>
                <Text dimColor={child.status === 'pending'}> {child.label}</Text>
                {child.duration && <Text dimColor> {child.duration}</Text>}
              </Box>
            ))}

            {selected && step.output && !step.children && (
              <Box marginLeft={3}>
                <Text dimColor color={colors.info}>  ↳ {step.output}</Text>
              </Box>
            )}
          </Box>
        )
      })}

      <Help keys={[{ key: 'j/k', label: 'navigate' }]} />
    </Box>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   VARIATION 6 — Waterfall / Gantt-inspired with nested indentation
   Shows parent-child relationships with indented blocks and status strips
   ═══════════════════════════════════════════════════════════════════════════ */

export function NewAIAgentTimelineV6() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  // Always-flat list with depth info
  const flat: { step: Step; depth: number; isLastChild: boolean; parentDone: boolean }[] = []
  for (const step of TIMELINE) {
    flat.push({ step, depth: 0, isLastChild: false, parentDone: step.status === 'done' })
    if (step.children) {
      step.children.forEach((child, ci) => {
        flat.push({
          step: child,
          depth: 1,
          isLastChild: ci === step.children!.length - 1,
          parentDone: step.status === 'done',
        })
      })
    }
  }

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
    if (key.downArrow || ch === 'j') setCursor(c => Math.min(flat.length - 1, c + 1))
  })

  const toolColor = (tool?: string) => {
    switch (tool) {
      case 'Read': return colors.info
      case 'Write': return colors.success
      case 'Edit': return colors.warning
      case 'Bash': return colors.error
      case 'Glob': return colors.secondary
      case 'Think': return colors.primary
      default: return colors.secondary
    }
  }

  const statusStrip = (status: Step['status'], width: number) => {
    switch (status) {
      case 'done': return { ch: '━'.repeat(width), color: colors.success }
      case 'running': return { ch: '━'.repeat(width - 1) + SPIN[frame % SPIN.length], color: colors.primary }
      case 'pending': return { ch: '╌'.repeat(width), color: '#555555' }
      case 'error': return { ch: '━'.repeat(width), color: colors.error }
    }
  }

  const doneCount = flat.filter(f => f.step.status === 'done').length
  const totalCount = flat.length

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={2} marginBottom={1}>
        <Badge label="Waterfall" color={colors.success} />
        <Text bold color={colors.success}>{doneCount}</Text>
        <Text dimColor>/ {totalCount} steps</Text>
        <MiniBar value={doneCount} max={totalCount} width={14} color={colors.success} />
      </Box>

      {flat.map((item, i) => {
        const { step, depth, isLastChild } = item
        const selected = i === cursor
        const tc = toolColor(step.tool)
        const isPending = step.status === 'pending'
        const strip = statusStrip(step.status, depth === 0 ? 3 : 2)

        // Build the indent prefix
        const prefix = depth === 0 ? '' : (isLastChild ? '  └ ' : '  ├ ')

        return (
          <Box key={step.id + i} flexDirection="column">
            <Box>
              {/* Selection gutter */}
              <Text color={selected ? colors.primary : undefined}>
                {selected ? ' ▸' : '  '}
              </Text>

              {/* Indent */}
              {depth > 0 && <Text dimColor>{prefix}</Text>}

              {/* Status strip */}
              <Text color={strip.color}> {strip.ch} </Text>

              {/* Tool pill */}
              {step.tool && (
                <Text inverse={selected} bold color={tc} dimColor={isPending && !selected}>
                  {selected ? ` ${step.tool} ` : step.tool}
                </Text>
              )}

              <Text> </Text>

              {/* Label */}
              <Text bold={selected && depth === 0} dimColor={isPending}>
                {step.label}
              </Text>

              {/* Duration */}
              {step.duration && (
                <Text dimColor> {step.duration}</Text>
              )}
            </Box>

            {/* Output on selection */}
            {selected && step.output && (
              <Box marginLeft={depth === 0 ? 6 : 12}>
                <Text dimColor color={colors.info}>↳ {step.output}</Text>
              </Box>
            )}
          </Box>
        )
      })}

      <Help keys={[{ key: 'j/k', label: 'navigate' }]} />
    </Box>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   VARIATION 7 — Multi-Agent Orchestration Flow
   Shows multiple named agents working in parallel, with handoffs,
   delegation, message passing, and convergence points.
   Three views: Timeline (chronological), By Agent (grouped), Flow Graph (visual)
   ═══════════════════════════════════════════════════════════════════════════ */

interface Agent {
  id: string
  name: string
  role: string
  icon: string
  color: (c: ReturnType<typeof useTheme>) => string
}

interface AgentEvent {
  id: string
  agentId: string
  type: 'think' | 'tool' | 'handoff' | 'message' | 'spawn' | 'result' | 'wait' | 'merge'
  label: string
  detail?: string
  status: 'done' | 'running' | 'pending' | 'error'
  duration?: string
  targetAgentId?: string
  parallel?: string
}

const AGENTS: Agent[] = [
  { id: 'orch', name: 'Orchestrator', role: 'Coordinates the team', icon: '◈', color: c => c.primary },
  { id: 'coder', name: 'Coder', role: 'Writes implementation', icon: '⬡', color: c => c.success },
  { id: 'researcher', name: 'Researcher', role: 'Gathers context', icon: '◇', color: c => c.info },
  { id: 'reviewer', name: 'Reviewer', role: 'Reviews quality', icon: '△', color: c => c.warning },
  { id: 'tester', name: 'Tester', role: 'Validates correctness', icon: '○', color: c => c.secondary },
]

const EVENTS: AgentEvent[] = [
  { id: 'e1', agentId: 'orch', type: 'think', label: 'Analyze task: "Add OAuth2 to the API"', status: 'done', duration: '1.4s' },
  { id: 'e2', agentId: 'orch', type: 'spawn', label: 'Delegate research & implementation', targetAgentId: 'coder', status: 'done', duration: '0.1s',
    detail: 'Spawning Researcher + Coder in parallel' },
  { id: 'e3', agentId: 'researcher', type: 'tool', label: 'Search: OAuth2 best practices', status: 'done', duration: '2.3s', parallel: 'p1',
    detail: 'Found 12 relevant sources on OAuth2 + Express' },
  { id: 'e4', agentId: 'researcher', type: 'tool', label: 'Read existing auth module', status: 'done', duration: '0.4s', parallel: 'p1',
    detail: 'src/auth.ts — 42 lines, JWT-based' },
  { id: 'e5', agentId: 'researcher', type: 'result', label: 'Compiled research brief', status: 'done', duration: '0.8s', parallel: 'p1',
    detail: 'Recommend: passport.js + Google/GitHub providers' },
  { id: 'e6', agentId: 'coder', type: 'tool', label: 'Read project structure', status: 'done', duration: '0.3s', parallel: 'p1' },
  { id: 'e7', agentId: 'coder', type: 'think', label: 'Plan file changes', status: 'done', duration: '1.1s', parallel: 'p1',
    detail: 'Need: passport config, OAuth routes, callback handler, env vars' },
  { id: 'e8', agentId: 'researcher', type: 'handoff', label: 'Send research brief → Coder', targetAgentId: 'coder', status: 'done', duration: '0.1s' },
  { id: 'e9', agentId: 'coder', type: 'tool', label: 'Write src/passport.ts', status: 'done', duration: '1.2s',
    detail: 'Google + GitHub strategy configuration' },
  { id: 'e10', agentId: 'coder', type: 'tool', label: 'Write src/routes/oauth.ts', status: 'done', duration: '0.9s',
    detail: 'Login, callback, and logout endpoints' },
  { id: 'e11', agentId: 'coder', type: 'tool', label: 'Edit src/app.ts', status: 'done', duration: '0.4s',
    detail: 'Register passport middleware + OAuth routes' },
  { id: 'e12', agentId: 'coder', type: 'tool', label: 'Write .env.example', status: 'done', duration: '0.2s' },
  { id: 'e13', agentId: 'coder', type: 'handoff', label: 'Send changes → Reviewer & Tester', targetAgentId: 'reviewer', status: 'done', duration: '0.1s' },
  { id: 'e14', agentId: 'reviewer', type: 'tool', label: 'Read all changed files', status: 'done', duration: '0.6s', parallel: 'p2' },
  { id: 'e15', agentId: 'reviewer', type: 'think', label: 'Check security patterns', status: 'running', duration: '1.8s', parallel: 'p2',
    detail: 'Checking: CSRF protection, token storage, callback validation...' },
  { id: 'e16', agentId: 'tester', type: 'tool', label: 'Write tests for OAuth flow', status: 'running', parallel: 'p2',
    detail: 'Testing: login redirect, callback handling, session creation' },
  { id: 'e17', agentId: 'tester', type: 'tool', label: 'Run test suite', status: 'pending', parallel: 'p2' },
  { id: 'e18', agentId: 'orch', type: 'wait', label: 'Waiting for Reviewer + Tester', status: 'pending',
    detail: 'Will merge results once both agents complete' },
  { id: 'e19', agentId: 'orch', type: 'merge', label: 'Compile final report', status: 'pending' },
]

export function NewAIAgentTimelineV7() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [frame, setFrame] = useState(0)
  const [view, setView] = useState<'timeline' | 'agents' | 'graph'>('timeline')

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 80)
    return () => clearInterval(id)
  }, [])

  useInput((ch, key) => {
    if (ch === 'v') setView(v => v === 'timeline' ? 'agents' : v === 'agents' ? 'graph' : 'timeline')
    if (view === 'timeline') {
      if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
      if (key.downArrow || ch === 'j') setCursor(c => Math.min(EVENTS.length - 1, c + 1))
    } else if (view === 'agents') {
      if (key.upArrow || ch === 'k') setCursor(c => Math.max(0, c - 1))
      if (key.downArrow || ch === 'j') setCursor(c => Math.min(AGENTS.length - 1, c + 1))
    }
  })

  const getAgent = (id: string) => AGENTS.find(a => a.id === id)!

  const eventIcon = (type: AgentEvent['type']) => {
    switch (type) {
      case 'think': return '◆'
      case 'tool': return '▶'
      case 'handoff': return '⤳'
      case 'message': return '✉'
      case 'spawn': return '⊕'
      case 'result': return '◉'
      case 'wait': return '⏸'
      case 'merge': return '⊗'
    }
  }

  const statusChar = (status: AgentEvent['status']) => {
    switch (status) {
      case 'done': return { ch: '✓', color: colors.success }
      case 'running': return { ch: SPIN[frame % SPIN.length]!, color: colors.primary }
      case 'pending': return { ch: '·', color: '#555555' }
      case 'error': return { ch: '✗', color: colors.error }
    }
  }

  const agentStats = AGENTS.map(a => {
    const events = EVENTS.filter(e => e.agentId === a.id)
    const done = events.filter(e => e.status === 'done').length
    const running = events.filter(e => e.status === 'running').length
    const totalTime = events.reduce((sum, e) => sum + parseFloat(e.duration ?? '0'), 0)
    return { agent: a, events, done, running, total: events.length, totalTime }
  })

  const doneEvents = EVENTS.filter(e => e.status === 'done').length
  const runningEvents = EVENTS.filter(e => e.status === 'running').length

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box gap={2} marginBottom={0}>
        <Badge label="Multi-Agent" color={colors.primary} />
        <Text bold color={colors.success}>{doneEvents}</Text>
        <Text dimColor>done</Text>
        {runningEvents > 0 && (
          <>
            <Text bold color={colors.primary}>{runningEvents}</Text>
            <Text dimColor>active</Text>
          </>
        )}
        <Text dimColor>·</Text>
        <Text dimColor>{AGENTS.length} agents</Text>
      </Box>

      {/* Agent status bar */}
      <Box gap={2} marginBottom={1} marginTop={0}>
        {AGENTS.map(a => {
          const stats = agentStats.find(s => s.agent.id === a.id)!
          const hasRunning = stats.running > 0
          const allDone = stats.done === stats.total && stats.total > 0
          const col = a.color(colors)
          return (
            <Box key={a.id} gap={1}>
              <Text color={col} bold={hasRunning}>
                {a.icon}
              </Text>
              <Text color={hasRunning ? col : allDone ? colors.success : undefined} dimColor={!hasRunning && !allDone} bold={hasRunning}>
                {a.name}
              </Text>
              {hasRunning && <Text color={colors.primary}>{SPIN[frame % SPIN.length]}</Text>}
              {allDone && <Text color={colors.success}>✓</Text>}
            </Box>
          )
        })}
      </Box>

      {/* View tabs */}
      <Box gap={2} marginBottom={0}>
        {(['timeline', 'agents', 'graph'] as const).map(v => (
          <Text
            key={v}
            bold={view === v}
            color={view === v ? colors.primary : undefined}
            dimColor={view !== v}
            underline={view === v}
          >
            {v === 'timeline' ? '◇ Timeline' : v === 'agents' ? '◆ By Agent' : '◈ Flow Graph'}
          </Text>
        ))}
      </Box>

      <Sep />

      {/* ── TIMELINE VIEW ── */}
      {view === 'timeline' && (
        <Box flexDirection="column" marginTop={0}>
          {EVENTS.map((event, i) => {
            const selected = i === cursor
            const agent = getAgent(event.agentId)
            const agentCol = agent.color(colors)
            const sc = statusChar(event.status)
            const isPending = event.status === 'pending'
            const targetAgent = event.targetAgentId ? getAgent(event.targetAgentId) : null
            const isHandoff = event.type === 'handoff' || event.type === 'spawn'

            const prevParallel = i > 0 ? EVENTS[i - 1]!.parallel : undefined
            const nextParallel = i < EVENTS.length - 1 ? EVENTS[i + 1]!.parallel : undefined
            const isParallelStart = event.parallel && event.parallel !== prevParallel
            const isParallelEnd = event.parallel && event.parallel !== nextParallel
            const inParallel = !!event.parallel

            return (
              <Box key={event.id} flexDirection="column">
                {isParallelStart && (
                  <Box gap={1} marginBottom={0}>
                    <Text dimColor>  ┌─ </Text>
                    <Text dimColor italic>parallel</Text>
                    <Text dimColor> {'─'.repeat(40)}</Text>
                  </Box>
                )}

                <Box>
                  <Text dimColor>
                    {inParallel ? '  │ ' : '    '}
                  </Text>
                  <Text color={sc.color} bold>{sc.ch} </Text>
                  <Text color={selected ? colors.primary : undefined}>
                    {selected ? '▸' : ' '}
                  </Text>
                  <Text inverse bold color={agentCol}> {agent.icon} {agent.name} </Text>
                  <Text color={agentCol}> {eventIcon(event.type)} </Text>
                  <Text bold={selected} dimColor={isPending}>{event.label}</Text>
                  {isHandoff && targetAgent && (
                    <Text color={targetAgent.color(colors)} dimColor={isPending}>
                      {' → '}{targetAgent.icon} {targetAgent.name}
                    </Text>
                  )}
                  {event.duration && (
                    <Text dimColor> {event.duration}</Text>
                  )}
                </Box>

                {selected && event.detail && (
                  <Box marginLeft={inParallel ? 8 : 6}>
                    <Text dimColor color={colors.info}>↳ {event.detail}</Text>
                  </Box>
                )}

                {isParallelEnd && (
                  <Box>
                    <Text dimColor>  └{'─'.repeat(50)}</Text>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      )}

      {/* ── BY AGENT VIEW ── */}
      {view === 'agents' && (
        <Box flexDirection="column" marginTop={0}>
          {agentStats.map((stats, ai) => {
            const selected = ai === cursor
            const col = stats.agent.color(colors)
            const hasRunning = stats.running > 0
            const allDone = stats.done === stats.total && stats.total > 0

            return (
              <Box key={stats.agent.id} flexDirection="column" marginBottom={1}>
                <Box gap={1}>
                  <Text color={selected ? colors.primary : undefined}>
                    {selected ? '▸' : ' '}
                  </Text>
                  <Text inverse bold color={col}> {stats.agent.icon} {stats.agent.name} </Text>
                  <Text dimColor>{stats.agent.role}</Text>
                  <Text dimColor>·</Text>
                  <Text color={allDone ? colors.success : hasRunning ? colors.primary : undefined}>
                    {stats.done}/{stats.total}
                  </Text>
                  {stats.totalTime > 0 && <Text dimColor>{stats.totalTime.toFixed(1)}s</Text>}
                </Box>

                {selected && stats.events.map(event => {
                  const sc = statusChar(event.status)
                  const targetAgent = event.targetAgentId ? getAgent(event.targetAgentId) : null

                  return (
                    <Box key={event.id} gap={1} marginLeft={4}>
                      <Text color={sc.color}>{sc.ch}</Text>
                      <Text dimColor={event.status === 'pending'}>
                        {eventIcon(event.type)} {event.label}
                      </Text>
                      {targetAgent && (
                        <Text color={targetAgent.color(colors)} dimColor>
                          → {targetAgent.name}
                        </Text>
                      )}
                      {event.duration && <Text dimColor>{event.duration}</Text>}
                    </Box>
                  )
                })}

                {!selected && stats.total > 0 && (
                  <Box marginLeft={4}>
                    <MiniBar
                      value={stats.done + stats.running * 0.5}
                      max={stats.total}
                      width={stats.total * 3}
                      color={allDone ? colors.success : hasRunning ? colors.primary : '#555555'}
                    />
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      )}

      {/* ── FLOW GRAPH VIEW ── */}
      {view === 'graph' && (
        <Box flexDirection="column" marginTop={0}>
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={colors.primary}>Phase 1 — Planning</Text>
            <Box marginLeft={2} gap={1}>
              <Text color={AGENTS[0]!.color(colors)}>{AGENTS[0]!.icon}</Text>
              <Text color={colors.success}>━━━━━</Text>
              <Text color={colors.success}>✓ Analyze task</Text>
            </Box>
            <Box marginLeft={2} gap={1}>
              <Text color={AGENTS[0]!.color(colors)}>{AGENTS[0]!.icon}</Text>
              <Text color={colors.success}>━━</Text>
              <Text color={colors.success}>✓ Spawn agents</Text>
            </Box>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={colors.info}>Phase 2 — Research & Prep</Text>
            <Box marginLeft={2}>
              <Text dimColor>┌{'─'.repeat(44)}┐</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>│ </Text>
              <Box width={20}>
                <Text color={AGENTS[2]!.color(colors)}>{AGENTS[2]!.icon} Researcher</Text>
              </Box>
              <Text dimColor>│ </Text>
              <Box width={20}>
                <Text color={AGENTS[1]!.color(colors)}>{AGENTS[1]!.icon} Coder</Text>
              </Box>
              <Text dimColor>│</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={colors.success}>━━━━━━━━ ✓ Search  </Text></Box>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={colors.success}>━━━ ✓ Read project </Text></Box>
              <Text dimColor>│</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={colors.success}>━━ ✓ Read auth     </Text></Box>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={colors.success}>━━━━ ✓ Plan changes</Text></Box>
              <Text dimColor>│</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={colors.success}>━━━ ✓ Brief        </Text></Box>
              <Text dimColor>│ </Text>
              <Box width={20}><Text> </Text></Box>
              <Text dimColor>│</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>└{'─'.repeat(10)}</Text>
              <Text color={colors.success}> ⤳ handoff </Text>
              <Text dimColor>{'─'.repeat(7)}┘</Text>
            </Box>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={colors.success}>Phase 3 — Implementation</Text>
            <Box marginLeft={2} gap={1}>
              <Text color={AGENTS[1]!.color(colors)}>{AGENTS[1]!.icon}</Text>
              <Text color={colors.success}>━━━━ ✓ passport.ts</Text>
              <Text dimColor>→</Text>
              <Text color={colors.success}>━━━ ✓ oauth.ts</Text>
              <Text dimColor>→</Text>
              <Text color={colors.success}>━━ ✓ app.ts</Text>
              <Text dimColor>→</Text>
              <Text color={colors.success}>━ ✓ .env</Text>
            </Box>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={colors.warning}>Phase 4 — Validation</Text>
            <Box marginLeft={2}>
              <Text dimColor>┌{'─'.repeat(44)}┐</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={AGENTS[3]!.color(colors)}>{AGENTS[3]!.icon} Reviewer</Text></Box>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={AGENTS[4]!.color(colors)}>{AGENTS[4]!.icon} Tester</Text></Box>
              <Text dimColor>│</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={colors.success}>━━━ ✓ Read files   </Text></Box>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={colors.primary}>━━━━ {SPIN[frame % SPIN.length]} Write tests </Text></Box>
              <Text dimColor>│</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>│ </Text>
              <Box width={20}><Text color={colors.primary}>━━━━━ {SPIN[frame % SPIN.length]} Security  </Text></Box>
              <Text dimColor>│ </Text>
              <Box width={20}><Text dimColor>╌╌╌╌ · Run tests   </Text></Box>
              <Text dimColor>│</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>└{'─'.repeat(10)}</Text>
              <Text dimColor> ⏸ waiting </Text>
              <Text dimColor>{'─'.repeat(7)}┘</Text>
            </Box>
          </Box>

          <Box flexDirection="column">
            <Text bold dimColor>Phase 5 — Merge</Text>
            <Box marginLeft={2} gap={1}>
              <Text dimColor>{AGENTS[0]!.icon}</Text>
              <Text dimColor>╌╌╌╌╌ · Merge results → Final report</Text>
            </Box>
          </Box>
        </Box>
      )}

      <Help keys={[
        { key: 'j/k', label: 'navigate' },
        { key: 'v', label: 'view' },
      ]} />
    </Box>
  )
}
