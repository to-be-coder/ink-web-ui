import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep } from './utils'

const DOCUMENTS = [
  {
    title: 'API Reference',
    lines: [
      { type: 'h1', text: 'Authentication API' },
      { type: 'p', text: '' },
      { type: 'h2', text: 'Endpoints' },
      { type: 'p', text: '' },
      { type: 'h3', text: 'POST /auth/login' },
      { type: 'p', text: 'Authenticates a user and returns a JWT token.' },
      { type: 'p', text: '' },
      { type: 'table-header', text: 'Parameter      │ Type     │ Required │ Description' },
      { type: 'table-sep', text: '───────────────┼──────────┼──────────┼─────────────────────' },
      { type: 'table-row', text: 'email          │ string   │ yes      │ User email address' },
      { type: 'table-row', text: 'password       │ string   │ yes      │ User password' },
      { type: 'table-row', text: 'remember       │ boolean  │ no       │ Extended token expiry' },
      { type: 'p', text: '' },
      { type: 'blockquote', text: '> Note: Tokens expire after 24h by default, 30d with remember.' },
      { type: 'p', text: '' },
      { type: 'h3', text: 'Response' },
      { type: 'code', text: '{' },
      { type: 'code', text: '  "token": "eyJhbGciOiJIUzI1NiJ9...",' },
      { type: 'code', text: '  "user": { "id": 1, "email": "user@example.com" },' },
      { type: 'code', text: '  "expiresAt": "2024-01-15T10:30:00Z"' },
      { type: 'code', text: '}' },
      { type: 'p', text: '' },
      { type: 'h3', text: 'Error Codes' },
      { type: 'bullet', text: '• 401 — Invalid credentials' },
      { type: 'bullet', text: '• 429 — Rate limited (max 5 attempts/min)' },
      { type: 'bullet', text: '• 503 — Auth service unavailable' },
      { type: 'p', text: '' },
      { type: 'hr', text: '' },
      { type: 'p', text: '' },
      { type: 'h3', text: 'GET /auth/me' },
      { type: 'p', text: 'Returns the currently authenticated user.' },
      { type: 'p', text: 'Requires: `Authorization: Bearer <token>` header' },
      { type: 'p', text: '' },
      { type: 'checkbox-done', text: '✓ Rate limiting implemented' },
      { type: 'checkbox-done', text: '✓ Input validation added' },
      { type: 'checkbox', text: '○ Add refresh token endpoint' },
      { type: 'checkbox', text: '○ Add OAuth2 providers' },
    ],
  },
]

export function NewAIMarkdownPreview() {
  const colors = useTheme()
  const [scroll, setScroll] = useState(0)
  const [docIdx] = useState(0)
  const doc = DOCUMENTS[docIdx]!
  const maxVisible = 20
  const visible = doc.lines.slice(scroll, scroll + maxVisible)

  useInput((ch, key) => {
    if (key.upArrow || ch === 'k') setScroll(s => Math.max(0, s - 1))
    if (key.downArrow || ch === 'j') setScroll(s => Math.min(Math.max(0, doc.lines.length - maxVisible), s + 1))
    if (ch === 'g') setScroll(0)
    if (ch === 'G') setScroll(Math.max(0, doc.lines.length - maxVisible))
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Box gap={2} marginBottom={1}>
        <Badge label="Markdown" color={colors.primary} />
        <Text bold>{doc.title}</Text>
        <Text dimColor>·</Text>
        <Text dimColor>{doc.lines.length} lines</Text>
      </Box>

      <Sep />

      <Box flexDirection="column" marginTop={0}>
        {visible.map((line, i) => renderMarkdownLine(line, colors, i))}
      </Box>

      {/* Scroll indicator */}
      {doc.lines.length > maxVisible && (
        <Box marginTop={1} gap={1}>
          <Text dimColor>
            ─ {scroll + 1}–{Math.min(scroll + maxVisible, doc.lines.length)} of {doc.lines.length} ─
          </Text>
          <Text color={colors.primary}>
            {scroll > 0 ? '▲' : ' '} {scroll + maxVisible < doc.lines.length ? '▼' : ' '}
          </Text>
        </Box>
      )}

      <Help keys={[
        { key: 'j/k', label: 'scroll' },
        { key: 'g', label: 'top' },
        { key: 'G', label: 'bottom' },
      ]} />
    </Box>
  )
}

function renderMarkdownLine(
  line: { type: string; text: string },
  colors: ReturnType<typeof useTheme>,
  key: number
) {
  switch (line.type) {
    case 'h1':
      return (
        <Box key={key} flexDirection="column">
          <Text bold color={colors.primary}>{'═'.repeat(line.text.length + 2)}</Text>
          <Text bold color={colors.primary}> {line.text} </Text>
          <Text bold color={colors.primary}>{'═'.repeat(line.text.length + 2)}</Text>
        </Box>
      )
    case 'h2':
      return (
        <Box key={key} flexDirection="column">
          <Text bold color={colors.secondary}>── {line.text} ──</Text>
        </Box>
      )
    case 'h3':
      return <Text key={key} bold color={colors.info}>▸ {line.text}</Text>
    case 'p': {
      if (line.text.includes('`')) {
        const parts = line.text.split('`')
        return (
          <Text key={key}>
            {parts.map((p, i) => i % 2 === 1
              ? <Text key={i} color={colors.info} bold>{p}</Text>
              : <Text key={i}>{p}</Text>
            )}
          </Text>
        )
      }
      return <Text key={key}>{line.text}</Text>
    }
    case 'code':
      return (
        <Box key={key}>
          <Text dimColor color={colors.info}>  │ </Text>
          <Text>{colorJson(line.text, colors)}</Text>
        </Box>
      )
    case 'table-header':
      return <Text key={key} bold color={colors.info}>{line.text}</Text>
    case 'table-sep':
      return <Text key={key} dimColor>{line.text}</Text>
    case 'table-row':
      return <Text key={key}>{line.text}</Text>
    case 'blockquote':
      return (
        <Box key={key}>
          <Text color={colors.warning}>  ▎ </Text>
          <Text color={colors.warning} italic>{line.text.replace(/^> ?/, '')}</Text>
        </Box>
      )
    case 'bullet':
      return <Text key={key}> {line.text}</Text>
    case 'checkbox-done':
      return <Text key={key} color={colors.success}> {line.text}</Text>
    case 'checkbox':
      return <Text key={key} dimColor> {line.text}</Text>
    case 'hr':
      return <Text key={key} dimColor>{'─'.repeat(50)}</Text>
    default:
      return <Text key={key}>{line.text}</Text>
  }
}

function colorJson(line: string, colors: ReturnType<typeof useTheme>) {
  // Color JSON keys and string values
  if (line.includes('"')) {
    const parts = line.split('"')
    return (
      <Text>
        {parts.map((p, i) => {
          if (i % 2 === 1) {
            // Check if this is a key (followed by :) or value
            const isKey = parts[i + 1]?.trimStart().startsWith(':')
            return <Text key={i} color={isKey ? colors.secondary : colors.success}>"{p}"</Text>
          }
          return <Text key={i}>{p}</Text>
        })}
      </Text>
    )
  }
  return <Text>{line}</Text>
}
