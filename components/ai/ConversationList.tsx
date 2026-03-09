import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help } from './utils'

interface Conversation {
  id: string
  title: string
  preview: string
  time: string
  unread?: boolean
}

const CONVERSATIONS: Conversation[] = [
  { id: '1', title: 'Add auth to Express', preview: 'All 18 tests passing.', time: '2m ago', unread: true },
  { id: '2', title: 'Fix database migration', preview: 'Migration completed successfully.', time: '1h ago' },
  { id: '3', title: 'Refactor user service', preview: 'Extracted UserService class with...', time: '3h ago' },
  { id: '4', title: 'Setup CI/CD pipeline', preview: 'GitHub Actions workflow created.', time: 'Yesterday' },
  { id: '5', title: 'API rate limiting', preview: 'Added express-rate-limit with...', time: 'Yesterday' },
  { id: '6', title: 'Debug WebSocket issue', preview: 'The connection was closing due...', time: '2 days ago' },
]

export function AIConversationList() {
  const colors = useTheme()
  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  useInput((ch, key) => {
    if (key.upArrow) setCursor(c => Math.max(0, c - 1))
    if (key.downArrow) setCursor(c => Math.min(CONVERSATIONS.length - 1, c + 1))
    if (key.return) setSelected(CONVERSATIONS[cursor]!.id)
    if (ch === 'n') setSelected(null)
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold>Conversations</Text>
        <Text dimColor>{CONVERSATIONS.length} chats</Text>
      </Box>

      {CONVERSATIONS.map((conv, i) => {
        const isCursor = i === cursor
        const isSelected = conv.id === selected
        return (
          <Box key={conv.id} flexDirection="column" marginBottom={0}>
            <Box gap={1}>
              <Text color={isCursor ? colors.primary : undefined}>
                {isCursor ? '\u25B8' : ' '}
              </Text>
              {conv.unread && <Text color={colors.primary}>{'\u25CF'}</Text>}
              <Text bold={isCursor || conv.unread} color={isSelected ? colors.success : undefined}>
                {conv.title}
              </Text>
              <Text dimColor>{conv.time}</Text>
            </Box>
            {isCursor && (
              <Box marginLeft={conv.unread ? 4 : 3}>
                <Text dimColor>{conv.preview}</Text>
              </Box>
            )}
          </Box>
        )
      })}

      <Help keys={[
        { key: '\u2191\u2193', label: 'navigate' },
        { key: 'enter', label: 'open' },
        { key: 'n', label: 'new chat' },
      ]} />
    </Box>
  )
}
