import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Help, Badge, Sep } from './utils'

interface FeedbackItem {
  id: string
  message: string
  rating: 'up' | 'down' | null
  tags: string[]
  comment: string
}

const SAMPLE_RESPONSES: { role: string; text: string }[] = [
  { role: 'assistant', text: "I've refactored the auth module to use async/await\nand added proper error boundaries around each route." },
]

const FEEDBACK_TAGS = ['Accurate', 'Helpful', 'Clear', 'Too verbose', 'Incorrect', 'Off-topic']

export function NewAIFeedbackBar() {
  const colors = useTheme()
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [tagCursor, setTagCursor] = useState(0)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<'rate' | 'tag' | 'comment' | 'done'>('rate')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useInput((ch, key) => {
    if (phase === 'rate') {
      if (ch === 'y' || ch === 'u') { setRating('up'); setPhase('tag') }
      if (ch === 'n' || ch === 'd') { setRating('down'); setPhase('tag') }
    } else if (phase === 'tag') {
      if (key.leftArrow || ch === 'h') setTagCursor(c => Math.max(0, c - 1))
      if (key.rightArrow || ch === 'l') setTagCursor(c => Math.min(FEEDBACK_TAGS.length - 1, c + 1))
      if (ch === ' ') {
        setSelectedTags(s => {
          const next = new Set(s)
          const tag = FEEDBACK_TAGS[tagCursor]!
          if (next.has(tag)) next.delete(tag); else next.add(tag)
          return next
        })
      }
      if (key.return) setPhase('comment')
      if (key.tab) { setPhase('comment') }
    } else if (phase === 'comment') {
      if (key.return) {
        setPhase('done')
        setSubmitted(true)
      } else if (key.backspace || key.delete) {
        setComment(c => c.slice(0, -1))
      } else if (key.escape) {
        setPhase('done')
        setSubmitted(true)
      } else if (ch && !key.ctrl && !key.meta) {
        setComment(c => c + ch)
      }
    } else if (phase === 'done') {
      if (ch === 'r') {
        setRating(null)
        setSelectedTags(new Set())
        setComment('')
        setPhase('rate')
        setSubmitted(false)
      }
    }
  })

  return (
    <Box flexDirection="column" padding={1}>
      {/* Response preview */}
      <Box flexDirection="column" marginBottom={1}>
        <Box gap={1}>
          <Text bold color={colors.info}>◇ Assistant</Text>
        </Box>
        {SAMPLE_RESPONSES[0]!.text.split('\n').map((line, i) => (
          <Text key={i} dimColor>{line}</Text>
        ))}
      </Box>

      <Sep />

      {/* Rating phase */}
      <Box flexDirection="column" marginTop={1}>
        <Box gap={2}>
          <Text dimColor>Rate this response:</Text>
          <Box gap={3}>
            <Box gap={1}>
              <Text
                bold={rating === 'up'}
                color={rating === 'up' ? colors.success : undefined}
                dimColor={rating !== 'up' && phase !== 'rate'}
              >
                {rating === 'up' ? '▲' : '△'} Helpful
              </Text>
            </Box>
            <Box gap={1}>
              <Text
                bold={rating === 'down'}
                color={rating === 'down' ? colors.error : undefined}
                dimColor={rating !== 'down' && phase !== 'rate'}
              >
                {rating === 'down' ? '▼' : '▽'} Not helpful
              </Text>
            </Box>
          </Box>
          {phase === 'rate' && (
            <Text dimColor>(u/d)</Text>
          )}
        </Box>

        {/* Tags phase */}
        {(phase === 'tag' || phase === 'comment' || phase === 'done') && (
          <Box flexDirection="column" marginTop={1}>
            <Text dimColor>Tags:</Text>
            <Box gap={1} marginTop={0} flexWrap="wrap">
              {FEEDBACK_TAGS.map((tag, i) => {
                const isCursor = i === tagCursor && phase === 'tag'
                const isSelected = selectedTags.has(tag)
                const tagColor = ['Accurate', 'Helpful', 'Clear'].includes(tag) ? colors.success : colors.warning

                return (
                  <Box key={tag}>
                    {isSelected ? (
                      <Text inverse bold color={tagColor}> {tag} </Text>
                    ) : isCursor ? (
                      <Box borderStyle="round" borderColor={colors.primary} paddingLeft={0} paddingRight={0}>
                        <Text color={colors.primary}> {tag} </Text>
                      </Box>
                    ) : (
                      <Text dimColor> {tag} </Text>
                    )}
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}

        {/* Comment phase */}
        {(phase === 'comment' || phase === 'done') && (
          <Box flexDirection="column" marginTop={1}>
            <Text dimColor>Comment (optional):</Text>
            <Box gap={1} marginTop={0}>
              <Text color={colors.info}>❯</Text>
              <Text>{comment || (phase === 'comment' ? '' : '—')}</Text>
              {phase === 'comment' && <Text color={colors.primary}>█</Text>}
            </Box>
          </Box>
        )}

        {/* Submitted */}
        {submitted && (
          <Box marginTop={1} gap={1}>
            <Text color={colors.success} bold>✓ Feedback submitted</Text>
            <Text dimColor>
              {rating === 'up' ? '▲' : '▼'}
              {selectedTags.size > 0 && ` · ${[...selectedTags].join(', ')}`}
              {comment && ` · "${comment}"`}
            </Text>
          </Box>
        )}
      </Box>

      <Help keys={
        phase === 'rate' ? [{ key: 'u', label: 'upvote' }, { key: 'd', label: 'downvote' }]
        : phase === 'tag' ? [{ key: '◁/▷', label: 'navigate' }, { key: 'space', label: 'toggle' }, { key: '⏎', label: 'next' }]
        : phase === 'comment' ? [{ key: '⏎', label: 'submit' }, { key: 'esc', label: 'skip' }]
        : [{ key: 'r', label: 'reset' }]
      } />
    </Box>
  )
}
