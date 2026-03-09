import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

interface Row { name: string; status: string; size: string; modified: string }

const DATA: Row[] = [
  { name: 'index.ts', status: 'ok', size: '2.1k', modified: '2m ago' },
  { name: 'routes.ts', status: 'ok', size: '3.4k', modified: '5m ago' },
  { name: 'auth.ts', status: 'new', size: '1.8k', modified: '1m ago' },
  { name: 'types.ts', status: 'ok', size: '0.5k', modified: '8m ago' },
  { name: 'app.ts', status: 'modified', size: '1.2k', modified: '3m ago' },
  { name: 'middleware.ts', status: 'ok', size: '0.9k', modified: '12m ago' },
  { name: 'config.ts', status: 'ok', size: '0.3k', modified: '1h ago' },
]

type Col = keyof Row
const COLS: { key: Col; w: number }[] = [
  { key: 'name', w: 18 },
  { key: 'status', w: 12 },
  { key: 'size', w: 8 },
  { key: 'modified', w: 10 },
]

export function CleanDataTable() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [sortCol, setSortCol] = useState<Col>('name')
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = [...DATA].sort((a, b) => {
    const cmp = a[sortCol].localeCompare(b[sortCol])
    return sortAsc ? cmp : -cmp
  })

  useInput((ch, key) => {
    if (key.upArrow) setCursor(c => Math.max(0, c - 1))
    if (key.downArrow) setCursor(c => Math.min(sorted.length - 1, c + 1))
    if (ch === 's') {
      const colIdx = COLS.findIndex(c => c.key === sortCol)
      const nextIdx = (colIdx + 1) % COLS.length
      setSortCol(COLS[nextIdx]!.key)
      setSortAsc(true)
    }
    if (ch === 'o') setSortAsc(a => !a)
  })

  const statusColor = (s: string) => s === 'new' ? colors.success : s === 'modified' ? colors.primary : undefined

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box>
        <Text> </Text>
        {COLS.map(col => (
          <Text key={col.key} bold dimColor={col.key !== sortCol}>
            {(col.key + (col.key === sortCol ? (sortAsc ? ' \u25B2' : ' \u25BC') : '')).padEnd(col.w)}
          </Text>
        ))}
      </Box>
      <Text dimColor wrap="truncate-end">{'\u2500'.repeat(60)}</Text>

      {/* Rows */}
      {sorted.map((row, i) => (
        <Box key={row.name}>
          <Text color={i === cursor ? colors.primary : undefined}>
            {i === cursor ? '\u25B8' : ' '}
          </Text>
          {COLS.map(col => (
            <Text
              key={col.key}
              color={col.key === 'status' ? statusColor(row[col.key]) : undefined}
              bold={i === cursor}
            >
              {row[col.key].padEnd(col.w)}
            </Text>
          ))}
        </Box>
      ))}

      <Help keys={[
        { key: '\u2191\u2193', label: 'move' },
        { key: 's', label: 'sort col' },
        { key: 'o', label: 'order' },
      ]} />
    </Box>
  )
}
