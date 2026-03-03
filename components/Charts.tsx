import { useReducer, useEffect, useMemo } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// ─── Types ───────────────────────────────────────────────────────────

type ChartType = 'line' | 'bar' | 'sparkline' | 'gauge'

interface LineData {
  cpu: number[]
  memory: number[]
}

interface BarData {
  labels: string[]
  values: number[]
}

interface SparklineData {
  series: { label: string; colorKey: keyof ReturnType<typeof useTheme>; data: number[]; min: number; max: number }[]
}

interface GaugeData {
  gauges: { label: string; value: number }[]
}

interface State {
  activeChart: ChartType
  paused: boolean
  lineData: LineData
  barData: BarData
  sparklineData: SparklineData
  gaugeData: GaugeData
}

type Action =
  | { type: 'switch_chart'; chart: ChartType }
  | { type: 'toggle_pause' }
  | { type: 'tick' }
  | { type: 'reset' }

// ─── Helpers ─────────────────────────────────────────────────────────

function nextVal(prev: number, min: number, max: number, volatility: number = 0.15): number {
  const range = max - min
  const delta = (Math.random() - 0.5) * range * volatility
  return Math.max(min, Math.min(max, prev + delta))
}

function makeLineData(): LineData {
  return {
    cpu: Array.from({ length: 40 }, () => 20 + Math.random() * 60),
    memory: Array.from({ length: 40 }, () => 30 + Math.random() * 40),
  }
}

function makeBarData(): BarData {
  return {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    values: [35, 72, 58, 91, 44, 67],
  }
}

function makeSparklineData(): SparklineData {
  return {
    series: [
      { label: 'CPU', colorKey: 'success' as const, data: Array.from({ length: 40 }, () => 20 + Math.random() * 50), min: 0, max: 100 },
      { label: 'Memory', colorKey: 'info' as const, data: Array.from({ length: 40 }, () => 40 + Math.random() * 30), min: 0, max: 100 },
      { label: 'Network', colorKey: 'primary' as const, data: Array.from({ length: 40 }, () => 10 + Math.random() * 60), min: 0, max: 100 },
      { label: 'Latency', colorKey: 'warning' as const, data: Array.from({ length: 40 }, () => 5 + Math.random() * 40), min: 0, max: 200 },
      { label: 'Errors', colorKey: 'error' as const, data: Array.from({ length: 40 }, () => Math.random() * 8), min: 0, max: 50 },
    ],
  }
}

function makeGaugeData(): GaugeData {
  return {
    gauges: [
      { label: 'CPU', value: 42 + Math.random() * 10 },
      { label: 'Memory', value: 65 + Math.random() * 10 },
      { label: 'Disk', value: 78 + Math.random() * 5 },
      { label: 'Network', value: 23 + Math.random() * 10 },
    ],
  }
}

function makeInitState(): State {
  return {
    activeChart: 'line',
    paused: false,
    lineData: makeLineData(),
    barData: makeBarData(),
    sparklineData: makeSparklineData(),
    gaugeData: makeGaugeData(),
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'switch_chart':
      return { ...state, activeChart: action.chart }
    case 'toggle_pause':
      return { ...state, paused: !state.paused }
    case 'tick': {
      const lineData = {
        cpu: [...state.lineData.cpu.slice(1), nextVal(state.lineData.cpu[state.lineData.cpu.length - 1], 0, 100)],
        memory: [...state.lineData.memory.slice(1), nextVal(state.lineData.memory[state.lineData.memory.length - 1], 0, 100, 0.08)],
      }
      const sparklineData = {
        series: state.sparklineData.series.map(s => ({
          ...s,
          data: [...s.data.slice(1), nextVal(s.data[s.data.length - 1], s.min, s.max)],
        })),
      }
      const gaugeData = {
        gauges: state.gaugeData.gauges.map(g => ({
          ...g,
          value: nextVal(g.value, 5, 95, 0.1),
        })),
      }
      return { ...state, lineData, sparklineData, gaugeData }
    }
    case 'reset':
      return { ...state, lineData: makeLineData(), sparklineData: makeSparklineData(), gaugeData: makeGaugeData() }
  }
}

// ─── Braille Line Chart ─────────────────────────────────────────────

const BRAILLE_BASE = 0x2800
// Braille dot positions: each char is 2 cols x 4 rows
// Column 0: dots 1,2,3,7 (bits 0,1,2,6)
// Column 1: dots 4,5,6,8 (bits 3,4,5,7)
const DOT_MAP: number[][] = [
  [0x01, 0x08],  // row 0
  [0x02, 0x10],  // row 1
  [0x04, 0x20],  // row 2
  [0x40, 0x80],  // row 3
]

function renderBrailleChart(
  series: { data: number[]; color: string }[],
  width: number,
  height: number
): { grid: number[][]; } {
  const cellCols = width
  const cellRows = height
  // Each cell is 2x4 sub-pixels
  const pixelW = cellCols * 2
  const pixelH = cellRows * 4

  // Initialize grid
  const grid: number[][] = Array.from({ length: cellRows }, () =>
    Array.from({ length: cellCols }, () => 0)
  )

  for (const s of series) {
    const data = s.data.slice(-pixelW)
    for (let px = 0; px < data.length; px++) {
      const normalized = Math.max(0, Math.min(1, data[px] / 100))
      const py = Math.round((1 - normalized) * (pixelH - 1))
      const cellRow = Math.floor(py / 4)
      const cellCol = Math.floor(px / 2)
      const subRow = py % 4
      const subCol = px % 2
      if (cellRow >= 0 && cellRow < cellRows && cellCol >= 0 && cellCol < cellCols) {
        grid[cellRow][cellCol] |= DOT_MAP[subRow][subCol]
      }
    }
  }

  return { grid }
}

function LineChart({ data, colors }: { data: LineData; colors: ReturnType<typeof useTheme> }) {
  const chartWidth = 40
  const chartHeight = 10
  const yLabels = ['100%', ' 75%', ' 50%', ' 25%', '  0%']
  const yStep = chartHeight / (yLabels.length - 1)

  const { grid } = useMemo(() =>
    renderBrailleChart(
      [
        { data: data.cpu, color: colors.success },
        { data: data.memory, color: colors.info },
      ],
      chartWidth,
      chartHeight
    ),
    [data.cpu, data.memory, colors.success, colors.info]
  )

  // We need to render each row of braille chars, coloring dots per series
  // Since braille chars merge both series, we render the combined braille
  // and alternate coloring based on which series dominates each cell
  const cpuCurrent = data.cpu[data.cpu.length - 1]
  const memCurrent = data.memory[data.memory.length - 1]

  return (
    <Box flexDirection="column">
      {/* Legend */}
      <Box gap={3} marginBottom={1}>
        <Box>
          <Text color={colors.success}>\u2501\u2501</Text>
          <Text dimColor> CPU </Text>
          <Text color={colors.success} bold>{cpuCurrent.toFixed(1)}%</Text>
        </Box>
        <Box>
          <Text color={colors.info}>\u2501\u2501</Text>
          <Text dimColor> Mem </Text>
          <Text color={colors.info} bold>{memCurrent.toFixed(1)}%</Text>
        </Box>
      </Box>

      {/* Chart area with Y-axis */}
      {grid.map((row, rowIdx) => {
        const yLabelIdx = Math.round(rowIdx / yStep)
        const showLabel = rowIdx % Math.round(yStep) === 0 && yLabelIdx < yLabels.length
        const label = showLabel ? yLabels[yLabelIdx] : '    '

        // Determine dominant series per cell for coloring
        const brailleChars = row.map((cell, colIdx) => {
          if (cell === 0) return { char: String.fromCharCode(BRAILLE_BASE), color: undefined }
          const char = String.fromCharCode(BRAILLE_BASE + cell)

          // Simple heuristic: check which series has data closer to this row
          const cpuPixel = Math.round((1 - Math.max(0, Math.min(1, (data.cpu[Math.min(colIdx * 2, data.cpu.length - 1)] || 0) / 100))) * (chartHeight * 4 - 1))
          const memPixel = Math.round((1 - Math.max(0, Math.min(1, (data.memory[Math.min(colIdx * 2, data.memory.length - 1)] || 0) / 100))) * (chartHeight * 4 - 1))
          const rowCenter = rowIdx * 4 + 2
          const cpuDist = Math.abs(cpuPixel - rowCenter)
          const memDist = Math.abs(memPixel - rowCenter)

          const color = cpuDist <= memDist ? colors.success : colors.info
          return { char, color }
        })

        return (
          <Box key={rowIdx}>
            <Text dimColor>{label} \u2502</Text>
            {brailleChars.map((bc, ci) => (
              <Text key={ci} color={bc.color}>{bc.char}</Text>
            ))}
          </Box>
        )
      })}

      {/* X-axis */}
      <Box>
        <Text dimColor>     \u2514{'\u2500'.repeat(chartWidth)}</Text>
      </Box>
      <Box>
        <Text dimColor>      -40s           -20s            now</Text>
      </Box>
    </Box>
  )
}

// ─── Bar Chart ──────────────────────────────────────────────────────

const FULL_BLOCKS = '\u2588\u2589\u258A\u258B\u258C\u258D\u258E\u258F'

function BarChart({ data, colors }: { data: BarData; colors: ReturnType<typeof useTheme> }) {
  const maxVal = Math.max(...data.values)
  const chartHeight = 12
  const barWidth = 4
  const gap = 2

  function getBarColor(value: number): string {
    const pct = value / maxVal * 100
    if (pct > 75) return colors.error
    if (pct > 45) return colors.warning
    return colors.info
  }

  // Y-axis labels
  const yLabels = [maxVal, Math.round(maxVal * 0.75), Math.round(maxVal * 0.5), Math.round(maxVal * 0.25), 0]
  const yStep = chartHeight / (yLabels.length - 1)

  // Render row by row from top to bottom
  const rows: React.ReactNode[] = []
  for (let row = 0; row < chartHeight; row++) {
    const threshold = ((chartHeight - row) / chartHeight) * maxVal
    const yLabelIdx = Math.round(row / yStep)
    const showLabel = row % Math.round(yStep) === 0 && yLabelIdx < yLabels.length
    const label = showLabel ? String(yLabels[yLabelIdx]).padStart(4) : '    '

    const barSegments: React.ReactNode[] = []
    for (let i = 0; i < data.values.length; i++) {
      const val = data.values[i]
      if (i > 0) barSegments.push(<Text key={`gap${i}`}>{' '.repeat(gap)}</Text>)

      if (val >= threshold) {
        const fullFill = FULL_BLOCKS[0]
        barSegments.push(
          <Text key={`bar${i}`} color={getBarColor(val)}>
            {fullFill.repeat(barWidth)}
          </Text>
        )
      } else {
        // Check fractional fill
        const nextThreshold = ((chartHeight - row - 1) / chartHeight) * maxVal
        if (val > nextThreshold) {
          const fraction = (val - nextThreshold) / (threshold - nextThreshold)
          const blockIdx = Math.min(Math.floor((1 - fraction) * 8), 7)
          const partialChar = FULL_BLOCKS[blockIdx] || ' '
          barSegments.push(
            <Text key={`bar${i}`} color={getBarColor(val)}>
              {partialChar.repeat(barWidth)}
            </Text>
          )
        } else {
          barSegments.push(
            <Text key={`bar${i}`}>
              {' '.repeat(barWidth)}
            </Text>
          )
        }
      }
    }

    rows.push(
      <Box key={row}>
        <Text dimColor>{label} \u2502</Text>
        <Text> </Text>
        {barSegments}
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      {rows}
      {/* X-axis */}
      <Box>
        <Text dimColor>     \u2514{'\u2500'.repeat(data.labels.length * (barWidth + gap) - gap + 2)}</Text>
      </Box>
      {/* Labels */}
      <Box>
        <Text>      </Text>
        {data.labels.map((label, i) => (
          <Text key={i} dimColor>
            {i > 0 ? ' '.repeat(gap) : ''}{label.padStart(barWidth)}
          </Text>
        ))}
      </Box>
      {/* Values */}
      <Box marginTop={1}>
        <Text>      </Text>
        {data.values.map((val, i) => (
          <Text key={i} color={getBarColor(val)} bold>
            {i > 0 ? ' '.repeat(gap) : ''}{String(val).padStart(barWidth)}
          </Text>
        ))}
      </Box>
    </Box>
  )
}

// ─── Sparkline Chart ────────────────────────────────────────────────

const SPARK_BLOCKS = ['\u2581', '\u2582', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2588']

function renderSparkline(data: number[], min: number, max: number, width: number): string {
  const range = max - min || 1
  const visible = data.slice(-width)
  return visible.map(v => {
    const normalized = (v - min) / range
    const idx = Math.min(Math.floor(normalized * SPARK_BLOCKS.length), SPARK_BLOCKS.length - 1)
    return SPARK_BLOCKS[Math.max(0, idx)]
  }).join('')
}

function SparklineChart({ data, colors }: { data: SparklineData; colors: ReturnType<typeof useTheme> }) {
  const sparkWidth = 40

  return (
    <Box flexDirection="column" gap={1}>
      {data.series.map(s => {
        const current = s.data[s.data.length - 1] ?? 0
        const color = colors[s.colorKey]

        return (
          <Box key={s.label} flexDirection="column">
            <Box gap={2}>
              <Text color={color} bold>{s.label.padEnd(10)}</Text>
              <Text color={color}>{renderSparkline(s.data, s.min, s.max, sparkWidth)}</Text>
              <Text color={color} bold> {current.toFixed(1).padStart(6)}</Text>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

// ─── Gauge Chart ────────────────────────────────────────────────────

function GaugeChart({ data, colors }: { data: GaugeData; colors: ReturnType<typeof useTheme> }) {
  const gaugeWidth = 30

  function getGaugeColor(value: number): string {
    if (value > 80) return colors.error
    if (value >= 50) return colors.warning
    return colors.success
  }

  return (
    <Box flexDirection="column" gap={1}>
      {data.gauges.map(g => {
        const pct = Math.max(0, Math.min(100, g.value))
        const filled = Math.round((pct / 100) * gaugeWidth)
        const empty = gaugeWidth - filled
        const color = getGaugeColor(pct)

        return (
          <Box key={g.label} flexDirection="column">
            <Box gap={1}>
              <Text bold>{g.label.padEnd(10)}</Text>
              <Text color={color}>[</Text>
              <Text color={color}>{'\u2588'.repeat(filled)}</Text>
              <Text dimColor>{'\u2591'.repeat(empty)}</Text>
              <Text color={color}>]</Text>
              <Text color={color} bold> {pct.toFixed(0).padStart(3)}%</Text>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

// ─── Main Charts Component ──────────────────────────────────────────

const CHART_LABELS: Record<ChartType, string> = {
  line: 'Line Chart',
  bar: 'Bar Chart',
  sparkline: 'Sparkline',
  gauge: 'Gauge',
}

const CHART_ORDER: ChartType[] = ['line', 'bar', 'sparkline', 'gauge']

export function Charts() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, undefined, makeInitState)

  const { activeChart, paused } = state

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => dispatch({ type: 'tick' }), 500)
    return () => clearInterval(timer)
  }, [paused])

  useInput((ch) => {
    if (ch === '1') dispatch({ type: 'switch_chart', chart: 'line' })
    else if (ch === '2') dispatch({ type: 'switch_chart', chart: 'bar' })
    else if (ch === '3') dispatch({ type: 'switch_chart', chart: 'sparkline' })
    else if (ch === '4') dispatch({ type: 'switch_chart', chart: 'gauge' })
    else if (ch === ' ') dispatch({ type: 'toggle_pause' })
    else if (ch === 'r') dispatch({ type: 'reset' })
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Charts</Text>
        <Text dimColor>\u2014</Text>
        <Text bold>{CHART_LABELS[activeChart]}</Text>
        {paused ? (
          <Text color={colors.warning}>[paused]</Text>
        ) : (
          <Text color={colors.success}>[live]</Text>
        )}
      </Box>

      {/* Tab bar */}
      <Box marginBottom={1} gap={1}>
        {CHART_ORDER.map((ct, i) => {
          const isActive = ct === activeChart
          return (
            <Box key={ct}>
              <Text
                color={isActive ? colors.primary : undefined}
                bold={isActive}
                inverse={isActive}
              >
                {isActive ? ` ${i + 1}:${CHART_LABELS[ct]} ` : ` ${i + 1}:${CHART_LABELS[ct]} `}
              </Text>
            </Box>
          )
        })}
      </Box>

      {/* Chart area */}
      <Box flexDirection="column">
        {activeChart === 'line' && <LineChart data={state.lineData} colors={colors} />}
        {activeChart === 'bar' && <BarChart data={state.barData} colors={colors} />}
        {activeChart === 'sparkline' && <SparklineChart data={state.sparklineData} colors={colors} />}
        {activeChart === 'gauge' && <GaugeChart data={state.gaugeData} colors={colors} />}
      </Box>

      {/* Keybindings */}
      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> 1-4 </Text>
          <Text dimColor> chart</Text>
        </Box>
        <Box>
          <Text inverse bold> space </Text>
          <Text dimColor> {paused ? 'resume' : 'pause'}</Text>
        </Box>
        <Box>
          <Text inverse bold> r </Text>
          <Text dimColor> reset</Text>
        </Box>
      </Box>
    </Box>
  )
}
