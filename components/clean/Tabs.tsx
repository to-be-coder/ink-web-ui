import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

const TABS = [
  { label: 'Files', content: ['index.ts', 'app.ts', 'routes.ts', 'auth.ts', 'types.ts'] },
  { label: 'Output', content: ['[info] Server started on :3000', '[info] Connected to database', '[warn] Rate limit approaching'] },
  { label: 'Problems', content: ['src/routes.ts:14 - Missing auth middleware', 'src/types.ts:8 - Unused import'] },
]

export function CleanTabs() {
  const colors = useTheme()
  const [active, setActive] = useState(0)

  useInput((ch, key) => {
    if (key.tab || key.rightArrow) setActive(a => (a + 1) % TABS.length)
    if (key.leftArrow) setActive(a => (a - 1 + TABS.length) % TABS.length)
  })

  const tab = TABS[active]!

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={2} marginBottom={1}>
        {TABS.map((t, i) => (
          <Text
            key={t.label}
            bold={i === active}
            color={i === active ? colors.primary : undefined}
            dimColor={i !== active}
          >
            {t.label}
          </Text>
        ))}
      </Box>

      <Text dimColor wrap="truncate-end">
        {'\u2500'.repeat(60)}
      </Text>

      <Box flexDirection="column" marginTop={1}>
        {tab.content.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>

      <Help keys={[{ key: 'tab', label: 'switch' }, { key: '\u2190\u2192', label: 'navigate' }]} />
    </Box>
  )
}
