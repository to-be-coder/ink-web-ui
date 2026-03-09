import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Badge, Separator } from './utils'

/* ── State ── */

interface State {
  page: number
  mode: 'dots' | 'numbers' | 'progress'
}

type Action =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'first' }
  | { type: 'last' }
  | { type: 'goto'; page: number }
  | { type: 'toggle_mode' }

const PAGE_SIZE = 5
const ITEMS = Array.from({ length: 25 }, (_, i) => ({
  id: `item-${i + 1}`,
  name: [
    'Authentication', 'Database', 'Cache Layer', 'API Gateway', 'Load Balancer',
    'Message Queue', 'Search Engine', 'File Storage', 'CDN Proxy', 'DNS Service',
    'SSL Manager', 'Rate Limiter', 'Health Check', 'Log Aggregator', 'Metrics',
    'Alerting', 'CI Pipeline', 'CD Pipeline', 'Registry', 'Secrets Manager',
    'Config Server', 'Service Mesh', 'Tracing', 'Profiler', 'Debugger',
  ][i]!,
  status: ['active', 'active', 'idle', 'active', 'active', 'active', 'idle', 'active', 'active', 'error',
           'active', 'active', 'active', 'idle', 'active', 'error', 'active', 'active', 'active', 'active',
           'idle', 'active', 'active', 'idle', 'active'][i]!,
}))

const TOTAL_PAGES = Math.ceil(ITEMS.length / PAGE_SIZE)

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next': return { ...state, page: Math.min(TOTAL_PAGES - 1, state.page + 1) }
    case 'prev': return { ...state, page: Math.max(0, state.page - 1) }
    case 'first': return { ...state, page: 0 }
    case 'last': return { ...state, page: TOTAL_PAGES - 1 }
    case 'goto': return { ...state, page: Math.max(0, Math.min(TOTAL_PAGES - 1, action.page)) }
    case 'toggle_mode': {
      const modes: State['mode'][] = ['dots', 'numbers', 'progress']
      const idx = modes.indexOf(state.mode)
      return { ...state, mode: modes[(idx + 1) % modes.length]! }
    }
  }
}

/* ── Main ── */

export function ModernPaginator() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, { page: 0, mode: 'dots' })
  const { page, mode } = state

  const pageItems = ITEMS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useInput((ch, key) => {
    if (key.rightArrow || ch === 'l' || ch === 'n') dispatch({ type: 'next' })
    else if (key.leftArrow || ch === 'h' || ch === 'p') dispatch({ type: 'prev' })
    else if (ch === 'g') dispatch({ type: 'first' })
    else if (ch === 'G') dispatch({ type: 'last' })
    else if (ch === 't') dispatch({ type: 'toggle_mode' })
    else if (ch >= '1' && ch <= '9') dispatch({ type: 'goto', page: parseInt(ch) - 1 })
  })

  function statusColor(s: string): string {
    if (s === 'active') return colors.success
    if (s === 'error') return colors.error
    return 'gray'
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>Infrastructure</Text>
          <Text dimColor>{ITEMS.length} services</Text>
        </Box>

        {/* Items */}
        {pageItems.map((item, i) => {
          const globalIdx = page * PAGE_SIZE + i + 1
          return (
            <Box key={item.id} gap={1}>
              <Text dimColor>{globalIdx.toString().padStart(2)}.</Text>
              <Text color={statusColor(item.status)}>
                {item.status === 'active' ? '\u25CF' : item.status === 'error' ? '\u25B2' : '\u25CB'}
              </Text>
              <Text>{item.name.padEnd(16)}</Text>
              <Badge
                label={item.status}
                color={statusColor(item.status)}
                dimmed={item.status === 'idle'}
              />
            </Box>
          )
        })}

        <Separator />

        {/* Pagination control */}
        <Box justifyContent="center" marginTop={0} gap={2}>
          {mode === 'dots' && (
            <Box gap={0}>
              <Text color={page > 0 ? colors.primary : 'gray'}>{'\u25C0 '}</Text>
              {Array.from({ length: TOTAL_PAGES }, (_, i) => (
                <Text key={i} color={i === page ? colors.primary : 'gray'} bold={i === page}>
                  {i === page ? '\u25CF' : '\u25CB'}
                </Text>
              ))}
              <Text color={page < TOTAL_PAGES - 1 ? colors.primary : 'gray'}>{' \u25B6'}</Text>
            </Box>
          )}

          {mode === 'numbers' && (
            <Box gap={1}>
              <Text color={page > 0 ? colors.primary : 'gray'}>{'\u25C0'}</Text>
              {Array.from({ length: TOTAL_PAGES }, (_, i) => (
                <Text key={i} inverse={i === page} bold={i === page} color={i === page ? colors.primary : 'gray'}>
                  {i === page ? ` ${i + 1} ` : ` ${i + 1} `}
                </Text>
              ))}
              <Text color={page < TOTAL_PAGES - 1 ? colors.primary : 'gray'}>{'\u25B6'}</Text>
            </Box>
          )}

          {mode === 'progress' && (
            <Box gap={1}>
              <Text color={colors.primary}>{page + 1}/{TOTAL_PAGES}</Text>
              <Box>
                {Array.from({ length: 20 }, (_, i) => {
                  const pct = (page + 1) / TOTAL_PAGES
                  const filled = i < Math.round(pct * 20)
                  return <Text key={i} color={filled ? colors.primary : 'gray'}>{filled ? '\u2588' : '\u2591'}</Text>
                })}
              </Box>
              <Text dimColor>{Math.round(((page + 1) / TOTAL_PAGES) * 100)}%</Text>
            </Box>
          )}
        </Box>

        <HelpFooter keys={[
          { key: 'h/l', label: 'prev/next' },
          { key: 'g/G', label: 'first/last' },
          { key: 't', label: 'style' },
          { key: '1-5', label: 'jump' },
        ]} />
      </Card>
    </Box>
  )
}
