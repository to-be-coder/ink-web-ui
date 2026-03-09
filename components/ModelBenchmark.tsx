import { useState, useEffect, useRef, useMemo } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

interface Model {
  name: string
  colorKey: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'
  speed: number      // tokens/sec base
  variance: number   // speed randomness
  accuracy: number   // 0-100 base
  latency: number    // first-token ms
  cost: number       // $/1M tokens
}

interface ModelState {
  progress: number   // 0-100
  tokensGen: number
  tps: number        // current tokens/sec
  ttft: number       // time to first token
  score: number      // accuracy score
  phase: 'waiting' | 'starting' | 'running' | 'done'
  rank?: number
}

/* ── Data ── */

const MODELS: Model[] = [
  { name: 'Claude Opus',    colorKey: 'primary',   speed: 62,  variance: 8,  accuracy: 97, latency: 420, cost: 15.0 },
  { name: 'Claude Sonnet',  colorKey: 'info',      speed: 88,  variance: 12, accuracy: 94, latency: 280, cost: 3.0 },
  { name: 'Claude Haiku',   colorKey: 'success',   speed: 145, variance: 20, accuracy: 89, latency: 150, cost: 0.25 },
  { name: 'GPT-4o',         colorKey: 'warning',   speed: 78,  variance: 10, accuracy: 93, latency: 350, cost: 5.0 },
  { name: 'Gemini Pro',     colorKey: 'secondary', speed: 95,  variance: 15, accuracy: 91, latency: 300, cost: 3.5 },
  { name: 'Llama 70B',      colorKey: 'error',     speed: 55,  variance: 18, accuracy: 86, latency: 500, cost: 0.9 },
]

const BENCHMARK = 'MMLU-Pro'
const TOTAL_TOKENS = 2048
const BAR_WIDTH = 32
const TICK_MS = 80

const MEDAL = ['🥇', '🥈', '🥉']

/* ── Sparkline ── */

function Sparkline({ data, color, width }: { data: number[]; color: string; width: number }) {
  const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
  const visible = data.slice(-width)
  const max = Math.max(...visible, 1)
  const min = Math.min(...visible, 0)
  const range = max - min || 1

  return (
    <Text color={color}>
      {visible.map((v, i) => {
        const idx = Math.round(((v - min) / range) * (BLOCKS.length - 1))
        return BLOCKS[Math.min(idx, BLOCKS.length - 1)]
      }).join('')}
    </Text>
  )
}

/* ── Component ── */

export function ModelBenchmark() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [runId, setRunId] = useState(0)
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const [view, setView] = useState<'race' | 'leaderboard'>('race')
  const finishOrder = useRef<number[]>([])

  const [states, setStates] = useState<ModelState[]>(() =>
    MODELS.map(() => ({ progress: 0, tokensGen: 0, tps: 0, ttft: 0, score: 0, phase: 'waiting' as const }))
  )

  const [tpsHistory, setTpsHistory] = useState<number[][]>(() => MODELS.map(() => []))

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) {
        stdout.write('\x1b[2J\x1b[H')
        setReady(true)
      }
    }, 300)
    return () => { mountedRef.current = false; clearTimeout(id) }
  }, [])

  // Reset
  useEffect(() => {
    finishOrder.current = []
    setTick(0)
    setView('race')
    setTpsHistory(MODELS.map(() => []))
    setStates(MODELS.map(() => ({
      progress: 0, tokensGen: 0, tps: 0, ttft: 0, score: 0, phase: 'waiting' as const
    })))
  }, [runId])

  // Main tick
  useEffect(() => {
    if (!ready) return
    const id = setInterval(() => {
      if (!mountedRef.current || pausedRef.current) return
      setTick(t => t + 1)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [ready, runId])

  // Update model states based on tick
  useEffect(() => {
    if (!ready || tick === 0) return

    setStates(prev => {
      const next = prev.map((s, i) => {
        const model = MODELS[i]!
        const ms = tick * TICK_MS

        if (s.phase === 'done') return s

        // Waiting → starting after staggered delay
        if (s.phase === 'waiting' && ms > i * 120) {
          return { ...s, phase: 'starting' as const }
        }

        // Starting → running after latency
        if (s.phase === 'starting' && ms > i * 120 + model.latency) {
          return { ...s, phase: 'running' as const, ttft: model.latency }
        }

        if (s.phase !== 'running') return s

        // Generate tokens
        const jitter = (Math.random() - 0.5) * 2 * model.variance
        const currentTps = Math.max(10, model.speed + jitter)
        const tokensThisTick = currentTps * (TICK_MS / 1000)
        const newTokens = Math.min(s.tokensGen + tokensThisTick, TOTAL_TOKENS)
        const newProgress = (newTokens / TOTAL_TOKENS) * 100

        if (newTokens >= TOTAL_TOKENS) {
          const accuracyJitter = (Math.random() - 0.5) * 4
          if (!finishOrder.current.includes(i)) {
            finishOrder.current.push(i)
          }
          return {
            ...s,
            progress: 100,
            tokensGen: TOTAL_TOKENS,
            tps: Math.round(currentTps),
            score: Math.round(Math.min(100, Math.max(0, model.accuracy + accuracyJitter)) * 10) / 10,
            phase: 'done' as const,
            rank: finishOrder.current.indexOf(i) + 1,
          }
        }

        return {
          ...s,
          progress: newProgress,
          tokensGen: newTokens,
          tps: Math.round(currentTps),
        }
      })

      // Auto-switch to leaderboard when all done
      if (next.every(s => s.phase === 'done')) {
        setTimeout(() => setView('leaderboard'), 500)
      }

      return next
    })

    // Track TPS history
    setTpsHistory(prev =>
      prev.map((hist, i) => {
        const s = states[i]
        if (!s || s.phase !== 'running') return hist
        return [...hist.slice(-20), s.tps]
      })
    )
  }, [tick, ready])

  useInput((ch) => {
    if (ch === ' ') {
      pausedRef.current = !pausedRef.current
      setPaused(p => !p)
    }
    if (ch === 'r') setRunId(n => n + 1)
    if (ch === 'v') setView(v => v === 'race' ? 'leaderboard' : 'race')
  })

  if (!ready) return <Box />

  const allDone = states.every(s => s.phase === 'done')
  const elapsed = (tick * TICK_MS / 1000).toFixed(1)

  // Sorted leaderboard
  const leaderboard = useMemo(() => {
    return MODELS.map((m, i) => ({ model: m, state: states[i]!, idx: i }))
      .sort((a, b) => {
        if (a.state.phase === 'done' && b.state.phase !== 'done') return -1
        if (a.state.phase !== 'done' && b.state.phase === 'done') return 1
        if (a.state.phase === 'done' && b.state.phase === 'done') {
          return (a.state.rank ?? 99) - (b.state.rank ?? 99)
        }
        return b.state.progress - a.state.progress
      })
  }, [states])

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Text bold color={colors.primary}>⚡ Model Benchmark</Text>
          <Text dimColor>— {BENCHMARK}</Text>
        </Box>
        <Box gap={1}>
          {paused && <Text color={colors.warning} bold inverse> PAUSED </Text>}
          <Text dimColor>{elapsed}s</Text>
          <Text color={allDone ? colors.success : colors.info} bold>
            {states.filter(s => s.phase === 'done').length}/{MODELS.length}
          </Text>
        </Box>
      </Box>

      <Box marginY={1}>
        <Text dimColor>{'─'.repeat(60)}</Text>
      </Box>

      {view === 'race' ? (
        /* ── Race View ── */
        <Box flexDirection="column">
          {MODELS.map((model, i) => {
            const s = states[i]!
            const color = colors[model.colorKey]
            const filled = Math.round((s.progress / 100) * BAR_WIDTH)
            const empty = BAR_WIDTH - filled

            return (
              <Box key={i} flexDirection="column" marginBottom={i < MODELS.length - 1 ? 1 : 0}>
                <Box gap={1}>
                  <Box width={15}>
                    <Text color={color} bold={s.phase === 'running'}>
                      {s.phase === 'done' && s.rank && s.rank <= 3 ? MEDAL[s.rank - 1] + ' ' : '  '}
                      {model.name}
                    </Text>
                  </Box>

                  {/* Progress bar */}
                  <Text>
                    <Text color={color}>{'█'.repeat(filled)}</Text>
                    <Text dimColor>{'░'.repeat(empty)}</Text>
                  </Text>

                  {/* Stats */}
                  <Box width={8}>
                    <Text color={s.phase === 'done' ? colors.success : color} bold>
                      {s.progress.toFixed(0).padStart(3)}%
                    </Text>
                  </Box>

                  <Box width={12}>
                    {s.phase === 'running' && <Text dimColor>{s.tps} tok/s</Text>}
                    {s.phase === 'done' && <Text color={colors.success}>✓ done</Text>}
                    {s.phase === 'starting' && <Text color={colors.warning}>warming…</Text>}
                    {s.phase === 'waiting' && <Text dimColor>queued</Text>}
                  </Box>
                </Box>

                {/* TPS sparkline */}
                {s.phase === 'running' && tpsHistory[i] && tpsHistory[i]!.length > 2 && (
                  <Box marginLeft={17}>
                    <Sparkline data={tpsHistory[i]!} color={color} width={BAR_WIDTH} />
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      ) : (
        /* ── Leaderboard View ── */
        <Box flexDirection="column">
          <Box gap={1} marginBottom={1}>
            <Box width={4}><Text bold dimColor>#</Text></Box>
            <Box width={15}><Text bold dimColor>Model</Text></Box>
            <Box width={10}><Text bold dimColor>Score</Text></Box>
            <Box width={10}><Text bold dimColor>Speed</Text></Box>
            <Box width={10}><Text bold dimColor>TTFT</Text></Box>
            <Box width={12}><Text bold dimColor>Cost/1M</Text></Box>
          </Box>

          {leaderboard.map(({ model, state, idx }, pos) => {
            const color = colors[model.colorKey]
            const isDone = state.phase === 'done'

            return (
              <Box key={idx} gap={1}>
                <Box width={4}>
                  <Text>
                    {isDone && state.rank && state.rank <= 3
                      ? MEDAL[state.rank - 1]
                      : <Text dimColor>{(pos + 1).toString().padStart(2)}</Text>
                    }
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color={color} bold={isDone}>{model.name}</Text>
                </Box>
                <Box width={10}>
                  {isDone
                    ? <Text color={state.score >= 95 ? colors.success : state.score >= 90 ? colors.info : colors.warning}>{state.score}%</Text>
                    : <Text dimColor>—</Text>
                  }
                </Box>
                <Box width={10}>
                  {isDone
                    ? <Text>{state.tps} t/s</Text>
                    : <Text dimColor>{state.tps > 0 ? `${state.tps} t/s` : '—'}</Text>
                  }
                </Box>
                <Box width={10}>
                  {isDone
                    ? <Text>{state.ttft}ms</Text>
                    : <Text dimColor>—</Text>
                  }
                </Box>
                <Box width={12}>
                  <Text dimColor>${model.cost.toFixed(2)}</Text>
                </Box>
              </Box>
            )
          })}

          {allDone && (
            <Box marginTop={1} flexDirection="column">
              <Text dimColor>{'─'.repeat(60)}</Text>
              <Box marginTop={1} gap={1}>
                <Text color={colors.success} bold>Winner:</Text>
                <Text color={colors[MODELS[finishOrder.current[0]!]!.colorKey]} bold>
                  {MODELS[finishOrder.current[0]!]!.name}
                </Text>
                <Text dimColor>
                  — {states[finishOrder.current[0]!]!.score}% accuracy at {states[finishOrder.current[0]!]!.tps} tok/s
                </Text>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} gap={2}>
        <Box><Text inverse bold> space </Text><Text dimColor> {paused ? 'resume' : 'pause'}</Text></Box>
        <Box><Text inverse bold> v </Text><Text dimColor> {view === 'race' ? 'leaderboard' : 'race'}</Text></Box>
        <Box><Text inverse bold> r </Text><Text dimColor> restart</Text></Box>
      </Box>
    </Box>
  )
}
