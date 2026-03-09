import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge } from './utils'

interface ErrorData {
  type: string
  message: string
  detail?: string
  retryable: boolean
}

const ERRORS: ErrorData[] = [
  {
    type: 'API Error',
    message: 'Rate limit exceeded',
    detail: 'Too many requests. Please wait 30 seconds before retrying.',
    retryable: true,
  },
  {
    type: 'Tool Error',
    message: 'Command failed: npm test',
    detail: 'Process exited with code 1\n\nError: Cannot find module \'./auth\'\n  at Object.<anonymous> (src/routes.test.ts:3:1)',
    retryable: true,
  },
  {
    type: 'Context Error',
    message: 'Context window exceeded',
    detail: 'The conversation has exceeded the maximum context length of 200,000 tokens. Start a new conversation or use /compact.',
    retryable: false,
  },
]

export function AIErrorBlock() {
  const colors = useTheme()
  const [errorIdx, setErrorIdx] = useState(0)
  const [retried, setRetried] = useState(false)
  const error = ERRORS[errorIdx]!

  useInput((ch, key) => {
    if (ch === 'r' && error.retryable) setRetried(true)
    if (ch === 'n') { setErrorIdx(i => (i + 1) % ERRORS.length); setRetried(false) }
    if (key.escape) setRetried(false)
  })

  if (retried) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box gap={1}>
          <Text color={colors.success}>{'\u2713'}</Text>
          <Text>Retrying...</Text>
        </Box>
        <Help keys={[{ key: 'n', label: 'next error' }]} />
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.error}
        paddingX={2}
        paddingY={1}
      >
        <Box gap={1} marginBottom={1}>
          <Text color={colors.error}>{'\u25B2'}</Text>
          <Badge label={error.type} color={colors.error} />
          <Text bold color={colors.error}>{error.message}</Text>
        </Box>

        {error.detail && (
          <Box flexDirection="column">
            {error.detail.split('\n').map((line, i) => (
              <Text key={i} dimColor>{line}</Text>
            ))}
          </Box>
        )}

        {error.retryable && (
          <Box marginTop={1} gap={1}>
            <Text dimColor>Press</Text>
            <Text inverse bold> r </Text>
            <Text dimColor>to retry</Text>
          </Box>
        )}
      </Box>

      <Help keys={[
        ...(error.retryable ? [{ key: 'r', label: 'retry' }] : []),
        { key: 'n', label: 'next error' },
      ]} />
    </Box>
  )
}
