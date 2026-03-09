import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

const PAGES = [
  ['index.ts', 'app.ts', 'routes.ts', 'auth.ts'],
  ['types.ts', 'middleware.ts', 'config.ts', 'server.ts'],
  ['auth.test.ts', 'app.test.ts', 'routes.test.ts', 'config.test.ts'],
]

export function CleanPaginator() {
  const colors = useTheme()
  const [page, setPage] = useState(0)

  useInput((ch, key) => {
    if (key.leftArrow) setPage(p => Math.max(0, p - 1))
    if (key.rightArrow) setPage(p => Math.min(PAGES.length - 1, p + 1))
  })

  return (
    <Box flexDirection="column" padding={1}>
      {PAGES[page]!.map(item => (
        <Text key={item}>{item}</Text>
      ))}

      <Box marginTop={1} gap={1}>
        {PAGES.map((_, i) => (
          <Text key={i} color={i === page ? colors.primary : undefined} dimColor={i !== page}>
            {i === page ? '\u25CF' : '\u25CB'}
          </Text>
        ))}
        <Text dimColor>{page + 1}/{PAGES.length}</Text>
      </Box>

      <Help keys={[{ key: '\u2190\u2192', label: 'page' }]} />
    </Box>
  )
}
