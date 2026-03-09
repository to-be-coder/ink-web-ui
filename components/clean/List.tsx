import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

const ITEMS = [
  'TypeScript', 'ESLint', 'Prettier', 'Tailwind CSS',
  'Vitest', 'Playwright', 'Docker', 'GitHub Actions',
]

export function CleanList() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState('')

  const filtered = ITEMS.map((item, i) => ({ item, i }))
    .filter(({ item }) => item.toLowerCase().includes(filter.toLowerCase()))

  useInput((ch, key) => {
    if (key.upArrow) setCursor(c => Math.max(0, c - 1))
    if (key.downArrow) setCursor(c => Math.min(filtered.length - 1, c + 1))
    if (ch === ' ' && filtered[cursor]) {
      const idx = filtered[cursor]!.i
      setSelected(prev => {
        const next = new Set(prev)
        next.has(idx) ? next.delete(idx) : next.add(idx)
        return next
      })
    }
    if (key.backspace || key.delete) setFilter(f => f.slice(0, -1))
    if (ch && ch !== ' ' && !key.ctrl && !key.meta && !key.upArrow && !key.downArrow) {
      setFilter(f => f + ch)
      setCursor(0)
    }
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={1} marginBottom={1}>
        <Text dimColor>/</Text>
        <Text>{filter}</Text>
        <Text color={colors.primary}>{'\u2588'}</Text>
        {filter && <Text dimColor>{filtered.length} results</Text>}
      </Box>

      {filtered.map(({ item, i }, fi) => {
        const isCursor = fi === cursor
        const isSel = selected.has(i)
        return (
          <Box key={i} gap={1}>
            <Text color={isCursor ? colors.primary : undefined}>{isCursor ? '\u25B8' : ' '}</Text>
            <Text color={isSel ? colors.success : undefined}>{isSel ? '\u2713' : '\u25CB'}</Text>
            <Text bold={isCursor}>{item}</Text>
          </Box>
        )
      })}

      {filtered.length === 0 && <Text dimColor>No matches.</Text>}

      <Help keys={[
        { key: '\u2191\u2193', label: 'move' },
        { key: 'space', label: 'toggle' },
        { key: 'type', label: 'filter' },
      ]} />
    </Box>
  )
}
