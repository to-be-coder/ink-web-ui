import { useReducer, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogEntry {
  id: number
  timestamp: number
  level: LogLevel
  source: string
  message: string
}

interface State {
  entries: LogEntry[]
  filter: Record<LogLevel, boolean>
  searchQuery: string
  searchMode: boolean
  autoScroll: boolean
  scrollOffset: number
  paused: boolean
  showTimestamps: boolean
}

type Action =
  | { type: 'add_entry'; entry: LogEntry }
  | { type: 'toggle_level'; level: LogLevel }
  | { type: 'toggle_timestamps' }
  | { type: 'toggle_pause' }
  | { type: 'scroll_up' }
  | { type: 'scroll_down' }
  | { type: 'scroll_to_bottom' }
  | { type: 'enter_search' }
  | { type: 'exit_search' }
  | { type: 'search_char'; char: string }
  | { type: 'search_backspace' }
  | { type: 'clear' }

const MAX_ENTRIES = 200
const VISIBLE_LINES = 14

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add_entry': {
      if (state.paused) return state
      const entries = [...state.entries, action.entry].slice(-MAX_ENTRIES)
      const filtered = entries.filter(e => state.filter[e.level])
      const shouldAutoScroll = state.autoScroll
      return {
        ...state,
        entries,
        scrollOffset: shouldAutoScroll
          ? Math.max(0, filtered.length - VISIBLE_LINES)
          : state.scrollOffset,
      }
    }
    case 'toggle_level':
      return { ...state, filter: { ...state.filter, [action.level]: !state.filter[action.level] } }
    case 'toggle_timestamps':
      return { ...state, showTimestamps: !state.showTimestamps }
    case 'toggle_pause':
      return { ...state, paused: !state.paused }
    case 'scroll_up':
      return { ...state, scrollOffset: Math.max(0, state.scrollOffset - 1), autoScroll: false }
    case 'scroll_down': {
      const filtered = state.entries.filter(e => state.filter[e.level])
      const maxOffset = Math.max(0, filtered.length - VISIBLE_LINES)
      const newOffset = Math.min(state.scrollOffset + 1, maxOffset)
      return {
        ...state,
        scrollOffset: newOffset,
        autoScroll: newOffset >= maxOffset,
      }
    }
    case 'scroll_to_bottom': {
      const filtered = state.entries.filter(e => state.filter[e.level])
      return {
        ...state,
        scrollOffset: Math.max(0, filtered.length - VISIBLE_LINES),
        autoScroll: true,
      }
    }
    case 'enter_search':
      return { ...state, searchMode: true, searchQuery: '' }
    case 'exit_search':
      return { ...state, searchMode: false }
    case 'search_char':
      return { ...state, searchQuery: state.searchQuery + action.char }
    case 'search_backspace':
      return { ...state, searchQuery: state.searchQuery.slice(0, -1) }
    case 'clear':
      return { ...state, entries: [], scrollOffset: 0, autoScroll: true }
  }
}

function getLevelColor(colors: ReturnType<typeof useTheme>): Record<LogLevel, string> {
  return {
    error: colors.error,
    warn: colors.warning,
    info: colors.primary,
    debug: 'gray',
  }
}

const LEVEL_LABEL: Record<LogLevel, string> = {
  error: 'ERR',
  warn: 'WRN',
  info: 'INF',
  debug: 'DBG',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function highlightMatch(text: string, query: string, colors: ReturnType<typeof useTheme>): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <Text backgroundColor={colors.warning} color="black">{text.slice(idx, idx + query.length)}</Text>
      {text.slice(idx + query.length)}
    </>
  )
}

// Demo log generation
const SOURCES = ['api', 'db', 'auth', 'worker', 'cache', 'queue']

const LOG_TEMPLATES: { level: LogLevel; messages: string[] }[] = [
  {
    level: 'info',
    messages: [
      'GET /api/users 200 12ms',
      'POST /api/auth/login 200 45ms',
      'GET /api/health 200 2ms',
      'Connection pool: 8/20 active',
      'Cache hit ratio: 94.2%',
      'Worker processed 142 jobs in 30s',
      'Session cleanup: removed 23 expired',
      'Webhook delivered to https://hooks.example.com',
      'Rate limiter: 1240/5000 requests this window',
      'Background sync completed in 892ms',
    ],
  },
  {
    level: 'debug',
    messages: [
      'Query: SELECT * FROM users WHERE id = $1 [3ms]',
      'Redis GET user:session:a8f2 [0.4ms]',
      'JWT token validated for user_id=482',
      'Middleware chain: cors -> auth -> rate-limit -> handler',
      'WebSocket ping/pong latency: 12ms',
      'Garbage collection: freed 14MB in 8ms',
    ],
  },
  {
    level: 'warn',
    messages: [
      'Slow query detected: 2340ms on users_search',
      'Memory usage at 78% (1.56GB/2GB)',
      'Rate limit approaching for IP 192.168.1.42',
      'Deprecated API v1 called by client sdk/2.1.0',
      'Connection pool near capacity: 18/20',
      'Retry attempt 2/3 for external API call',
    ],
  },
  {
    level: 'error',
    messages: [
      'Failed to connect to replica db-read-02: ETIMEDOUT',
      'Unhandled rejection in worker task_id=7829',
      'S3 upload failed: AccessDenied on bucket prod-assets',
      'Circuit breaker tripped for payment-service',
      'TLS handshake failed: certificate expired',
    ],
  },
]

function generateLog(id: number): LogEntry {
  const weights = [0.45, 0.25, 0.2, 0.1] // info, debug, warn, error
  const r = Math.random()
  let templateIdx = 0
  let acc = 0
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]!
    if (r < acc) { templateIdx = i; break }
  }
  const template = LOG_TEMPLATES[templateIdx]!
  const message = template.messages[Math.floor(Math.random() * template.messages.length)]!
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)]!
  return {
    id,
    timestamp: Date.now(),
    level: template.level,
    source,
    message,
  }
}

function LevelFilter({ level, active }: { level: LogLevel; active: boolean }) {
  const colors = useTheme()
  const LEVEL_COLOR = getLevelColor(colors)
  return (
    <Box>
      <Text color={active ? LEVEL_COLOR[level] : 'gray'} bold={active}>
        {active ? '●' : '○'} {LEVEL_LABEL[level]}
      </Text>
    </Box>
  )
}

export function LogViewer() {
  const colors = useTheme()
  const LEVEL_COLOR = getLevelColor(colors)
  const nextId = useRef(1)
  const [state, dispatch] = useReducer(reducer, {
    entries: [],
    filter: { error: true, warn: true, info: true, debug: true },
    searchQuery: '',
    searchMode: false,
    autoScroll: true,
    scrollOffset: 0,
    paused: false,
    showTimestamps: true,
  })

  const { entries, filter, searchQuery, searchMode, autoScroll, scrollOffset, paused, showTimestamps } = state

  useEffect(() => {
    // Generate initial batch
    for (let i = 0; i < 8; i++) {
      dispatch({ type: 'add_entry', entry: generateLog(nextId.current++) })
    }

    const timer = setInterval(() => {
      const count = Math.random() < 0.3 ? 2 : 1
      for (let i = 0; i < count; i++) {
        dispatch({ type: 'add_entry', entry: generateLog(nextId.current++) })
      }
    }, 800 + Math.random() * 1200)
    return () => clearInterval(timer)
  }, [])

  useInput((ch, key) => {
    if (searchMode) {
      if (key.escape || key.return) dispatch({ type: 'exit_search' })
      else if (key.backspace || key.delete) dispatch({ type: 'search_backspace' })
      else if (ch && !key.ctrl && !key.meta) dispatch({ type: 'search_char', char: ch })
      return
    }

    if (ch === '/') dispatch({ type: 'enter_search' })
    else if (ch === 'j' || key.downArrow) dispatch({ type: 'scroll_down' })
    else if (ch === 'k' || key.upArrow) dispatch({ type: 'scroll_up' })
    else if (ch === 'G') dispatch({ type: 'scroll_to_bottom' })
    else if (ch === ' ') dispatch({ type: 'toggle_pause' })
    else if (ch === 't') dispatch({ type: 'toggle_timestamps' })
    else if (ch === 'c') dispatch({ type: 'clear' })
    else if (ch === '1') dispatch({ type: 'toggle_level', level: 'error' })
    else if (ch === '2') dispatch({ type: 'toggle_level', level: 'warn' })
    else if (ch === '3') dispatch({ type: 'toggle_level', level: 'info' })
    else if (ch === '4') dispatch({ type: 'toggle_level', level: 'debug' })
  })

  let filtered = entries.filter(e => filter[e.level])
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(e =>
      e.message.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q)
    )
  }

  const visible = filtered.slice(scrollOffset, scrollOffset + VISIBLE_LINES)

  const counts: Record<LogLevel, number> = { error: 0, warn: 0, info: 0, debug: 0 }
  for (const e of entries) counts[e.level]++

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Log Viewer</Text>
        {paused ? <Text color={colors.warning}>paused</Text> : <Text color={colors.success}>live</Text>}
        {!autoScroll && !paused && <Text color={colors.warning}>scroll locked</Text>}
        <Text dimColor>{entries.length} lines</Text>
      </Box>

      <Box gap={2} marginBottom={1}>
        <LevelFilter level="error" active={filter.error} />
        <LevelFilter level="warn" active={filter.warn} />
        <LevelFilter level="info" active={filter.info} />
        <LevelFilter level="debug" active={filter.debug} />
        <Text dimColor>
          {counts.error > 0 && <Text color={colors.error}>{counts.error}E </Text>}
          {counts.warn > 0 && <Text color={colors.warning}>{counts.warn}W </Text>}
          <Text>{counts.info}I </Text>
          <Text>{counts.debug}D</Text>
        </Text>
      </Box>

      {searchMode && (
        <Box marginBottom={1}>
          <Text color={colors.warning}>/ </Text>
          <Text>{searchQuery}</Text>
          <Text color="gray">_</Text>
          {searchQuery && <Text dimColor> ({filtered.length} matches)</Text>}
        </Box>
      )}
      {!searchMode && searchQuery && (
        <Box marginBottom={1}>
          <Text dimColor>search: </Text>
          <Text color={colors.warning}>{searchQuery}</Text>
          <Text dimColor> ({filtered.length} matches)</Text>
        </Box>
      )}

      <Box flexDirection="column">
        {visible.length === 0 && (
          <Text dimColor>No log entries match current filters</Text>
        )}
        {visible.map(entry => (
          <Box key={entry.id} gap={1}>
            {showTimestamps && <Text dimColor>{formatTime(entry.timestamp)}</Text>}
            <Text color={LEVEL_COLOR[entry.level]} bold>{LEVEL_LABEL[entry.level]}</Text>
            <Text dimColor>[{entry.source.padEnd(6)}]</Text>
            <Text>{searchQuery ? highlightMatch(entry.message, searchQuery, colors) : entry.message}</Text>
          </Box>
        ))}
      </Box>

      {filtered.length > VISIBLE_LINES && (
        <Text dimColor>
          {scrollOffset + 1}-{Math.min(scrollOffset + VISIBLE_LINES, filtered.length)} of {filtered.length}
        </Text>
      )}

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> space </Text>
          <Text dimColor> {paused ? 'resume' : 'pause'}</Text>
        </Box>
        <Box>
          <Text inverse bold> 1-4 </Text>
          <Text dimColor> filter</Text>
        </Box>
        <Box>
          <Text inverse bold> / </Text>
          <Text dimColor> search</Text>
        </Box>
        <Box>
          <Text inverse bold> t </Text>
          <Text dimColor> time</Text>
        </Box>
        <Box>
          <Text inverse bold> c </Text>
          <Text dimColor> clear</Text>
        </Box>
      </Box>
    </Box>
  )
}
