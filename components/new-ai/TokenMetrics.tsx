import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep, MiniBar, blendHex } from './utils'

interface Metrics {
  ttft: number        // ms
  totalTime: number   // ms
  inputTokens: number
  outputTokens: number
  tokensPerSec: number
  chunks: number
  model: string
  cacheHit: boolean
}

const HISTORY: Metrics[] = [
  { ttft: 245, totalTime: 3200, inputTokens: 1240, outputTokens: 420, tokensPerSec: 131, chunks: 28, model: 'opus-4', cacheHit: false },
  { ttft: 180, totalTime: 2100, inputTokens: 890, outputTokens: 310, tokensPerSec: 148, chunks: 22, model: 'opus-4', cacheHit: true },
  { ttft: 312, totalTime: 4800, inputTokens: 2100, outputTokens: 680, tokensPerSec: 142, chunks: 45, model: 'opus-4', cacheHit: false },
  { ttft: 95, totalTime: 1400, inputTokens: 540, outputTokens: 190, tokensPerSec: 136, chunks: 14, model: 'sonnet-4', cacheHit: true },
  { ttft: 210, totalTime: 2900, inputTokens: 1580, outputTokens: 510, tokensPerSec: 176, chunks: 34, model: 'sonnet-4', cacheHit: false },
  { ttft: 156, totalTime: 1800, inputTokens: 720, outputTokens: 280, tokensPerSec: 156, chunks: 19, model: 'opus-4', cacheHit: true },
]

export function NewAITokenMetrics() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(HISTORY.length - 1)
  const [view, setView] = useState<'detail' | 'sparkline'>('detail')
  const [live, setLive] = useState(false)
  const [liveTokens, setLiveTokens] = useState(0)
  const [liveElapsed, setLiveElapsed] = useState(0)

  const m = HISTORY[cursor]!

  // Live simulation
  useEffect(() => {
    if (!live) return
    setLiveTokens(0)
    setLiveElapsed(0)
    const id = setInterval(() => {
      setLiveTokens(t => {
        if (t >= 200) { setLive(false); return t }
        return t + Math.floor(Math.random() * 8 + 4)
      })
      setLiveElapsed(e => e + 100)
    }, 100)
    return () => clearInterval(id)
  }, [live])

  useInput((ch, key) => {
    if (key.leftArrow || ch === 'h') setCursor(c => Math.max(0, c - 1))
    if (key.rightArrow || ch === 'l') setCursor(c => Math.min(HISTORY.length - 1, c + 1))
    if (ch === 'v') setView(v => v === 'detail' ? 'sparkline' : 'detail')
    if (ch === 's') setLive(l => !l)
  })

  const ttftColor = (v: number) => v < 150 ? colors.success : v < 300 ? colors.warning : colors.error
  const tpsColor = (v: number) => v > 150 ? colors.success : v > 100 ? colors.info : colors.warning

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={2} marginBottom={1}>
        <Badge label="Metrics" color={colors.info} />
        <Text dimColor>Request {cursor + 1}/{HISTORY.length}</Text>
        <Text dimColor color={colors.secondary}>· {m.model}</Text>
        {m.cacheHit && <Badge label="CACHE" color={colors.success} />}
      </Box>

      {view === 'detail' ? (
        <Box flexDirection="column">
          {/* Primary metrics */}
          <Box gap={4}>
            <Box flexDirection="column">
              <Text dimColor>TTFT</Text>
              <Text bold color={ttftColor(m.ttft)}>{m.ttft}ms</Text>
            </Box>
            <Box flexDirection="column">
              <Text dimColor>Total</Text>
              <Text bold>{(m.totalTime / 1000).toFixed(1)}s</Text>
            </Box>
            <Box flexDirection="column">
              <Text dimColor>Tok/s</Text>
              <Text bold color={tpsColor(m.tokensPerSec)}>{m.tokensPerSec}</Text>
            </Box>
            <Box flexDirection="column">
              <Text dimColor>Chunks</Text>
              <Text bold>{m.chunks}</Text>
            </Box>
          </Box>

          <Sep />

          {/* Token breakdown */}
          <Box flexDirection="column" marginTop={1}>
            <Box gap={1}>
              <Text dimColor>Input  </Text>
              <MiniBar value={m.inputTokens} max={3000} width={24} color={colors.info} />
              <Text> {m.inputTokens.toLocaleString()}</Text>
            </Box>
            <Box gap={1}>
              <Text dimColor>Output </Text>
              <MiniBar value={m.outputTokens} max={3000} width={24} color={colors.primary} />
              <Text> {m.outputTokens.toLocaleString()}</Text>
            </Box>
            <Box gap={1} marginTop={0}>
              <Text dimColor>Total  </Text>
              <Text bold>{(m.inputTokens + m.outputTokens).toLocaleString()} tokens</Text>
            </Box>
          </Box>

          <Sep />

          {/* TTFT timeline visualization */}
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>TTFT Distribution</Text>
            <Box gap={0}>
              {HISTORY.map((h, i) => {
                const height = Math.max(1, Math.round(h.ttft / 60))
                const col = ttftColor(h.ttft)
                return (
                  <Box key={i} flexDirection="column" justifyContent="flex-end" width={6}>
                    <Text color={i === cursor ? colors.primary : col} bold={i === cursor}>
                      {i === cursor ? '▸' : ' '}{h.ttft}
                    </Text>
                    <Text color={col}>{'█'.repeat(Math.min(height, 5))}</Text>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          {/* Sparkline view */}
          <Text dimColor>Tok/s over requests</Text>
          <Box gap={0} marginTop={0}>
            {HISTORY.map((h, i) => {
              const bar = Math.max(1, Math.round(h.tokensPerSec / 20))
              const col = tpsColor(h.tokensPerSec)
              return (
                <Box key={i} flexDirection="column" width={8}>
                  <Text dimColor>{h.tokensPerSec}</Text>
                  <Text color={i === cursor ? colors.primary : col}>
                    {'█'.repeat(Math.min(bar, 8))}
                  </Text>
                  <Text dimColor>{i === cursor ? '▲' : ' '}</Text>
                </Box>
              )
            })}
          </Box>

          <Sep />

          <Text dimColor>TTFT over requests</Text>
          <Box gap={0} marginTop={0}>
            {HISTORY.map((h, i) => {
              const bar = Math.max(1, Math.round(h.ttft / 50))
              const col = ttftColor(h.ttft)
              return (
                <Box key={i} flexDirection="column" width={8}>
                  <Text dimColor>{h.ttft}ms</Text>
                  <Text color={i === cursor ? colors.primary : col}>
                    {'█'.repeat(Math.min(bar, 8))}
                  </Text>
                  <Text dimColor>{i === cursor ? '▲' : ' '}</Text>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Live simulation */}
      {live && (
        <Box marginTop={1} flexDirection="column">
          <Sep label="Live Stream" color={colors.success} />
          <Box gap={2}>
            <Text color={colors.success}>{liveTokens} tokens</Text>
            <Text dimColor>{liveElapsed}ms</Text>
            <Text color={colors.primary}>{liveElapsed > 0 ? Math.round(liveTokens / (liveElapsed / 1000)) : 0} tok/s</Text>
          </Box>
        </Box>
      )}

      <Help keys={[
        { key: '◁/▷', label: 'history' },
        { key: 'v', label: 'view' },
        { key: 's', label: 'simulate' },
      ]} />
    </Box>
  )
}
