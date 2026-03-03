import { useState } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface Line {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'code' | 'code_fence' | 'bullet' | 'numbered' | 'blockquote' | 'hr' | 'blank'
  content: string
  lang?: string
  indent?: number
  num?: number
}

function parseMd(raw: string): Line[] {
  const lines: Line[] = []
  const src = raw.split('\n')
  let i = 0

  while (i < src.length) {
    const line = src[i]!

    // Code fence
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      i++
      const codeLines: string[] = []
      while (i < src.length && !src[i]!.startsWith('```')) {
        codeLines.push(src[i]!)
        i++
      }
      i++ // skip closing ```
      lines.push({ type: 'code_fence', content: codeLines.join('\n'), lang })
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      lines.push({ type: 'h3', content: line.slice(4) })
    } else if (line.startsWith('## ')) {
      lines.push({ type: 'h2', content: line.slice(3) })
    } else if (line.startsWith('# ')) {
      lines.push({ type: 'h1', content: line.slice(2) })
    }
    // Horizontal rule
    else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      lines.push({ type: 'hr', content: '' })
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      lines.push({ type: 'blockquote', content: line.slice(2) })
    }
    // Bullet list
    else if (/^(\s*)[-*] /.test(line)) {
      const match = line.match(/^(\s*)[-*] (.*)/)!
      const indent = Math.floor(match[1]!.length / 2)
      lines.push({ type: 'bullet', content: match[2]!, indent })
    }
    // Numbered list
    else if (/^\s*\d+\. /.test(line)) {
      const match = line.match(/^(\s*)(\d+)\. (.*)/)!
      const indent = Math.floor(match[1]!.length / 2)
      lines.push({ type: 'numbered', content: match[3]!, num: Number(match[2]), indent })
    }
    // Inline code line
    else if (line.startsWith('    ') || line.startsWith('\t')) {
      lines.push({ type: 'code', content: line.slice(line.startsWith('\t') ? 1 : 4) })
    }
    // Blank line
    else if (line.trim() === '') {
      lines.push({ type: 'blank', content: '' })
    }
    // Paragraph
    else {
      lines.push({ type: 'paragraph', content: line })
    }

    i++
  }

  return lines
}

function InlineText({ text }: { text: string }) {
  const colors = useTheme()
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold + italic
    const boldItalic = remaining.match(/^\*\*\*(.+?)\*\*\*/)
    if (boldItalic) {
      parts.push(<Text key={key++} bold italic>{boldItalic[1]}</Text>)
      remaining = remaining.slice(boldItalic[0].length)
      continue
    }

    // Bold
    const bold = remaining.match(/^\*\*(.+?)\*\*/)
    if (bold) {
      parts.push(<Text key={key++} bold>{bold[1]}</Text>)
      remaining = remaining.slice(bold[0].length)
      continue
    }

    // Italic
    const italic = remaining.match(/^\*(.+?)\*/)
    if (italic) {
      parts.push(<Text key={key++} italic>{italic[1]}</Text>)
      remaining = remaining.slice(italic[0].length)
      continue
    }

    // Inline code
    const code = remaining.match(/^`(.+?)`/)
    if (code) {
      parts.push(<Text key={key++} color={colors.warning} backgroundColor="gray" dimColor> {code[1]} </Text>)
      remaining = remaining.slice(code[0].length)
      continue
    }

    // Link [text](url)
    const link = remaining.match(/^\[(.+?)\]\((.+?)\)/)
    if (link) {
      parts.push(<Text key={key++} color={colors.primary} underline>{link[1]}</Text>)
      remaining = remaining.slice(link[0].length)
      continue
    }

    // Strikethrough
    const strike = remaining.match(/^~~(.+?)~~/)
    if (strike) {
      parts.push(<Text key={key++} strikethrough dimColor>{strike[1]}</Text>)
      remaining = remaining.slice(strike[0].length)
      continue
    }

    // Plain text (up to next special character)
    const plain = remaining.match(/^[^*`\[~]+/)
    if (plain) {
      parts.push(<Text key={key++}>{plain[0]}</Text>)
      remaining = remaining.slice(plain[0].length)
      continue
    }

    // Single special char that didn't match a pattern
    parts.push(<Text key={key++}>{remaining[0]}</Text>)
    remaining = remaining.slice(1)
  }

  return <>{parts}</>
}

function RenderLine({ line }: { line: Line }) {
  const colors = useTheme()
  switch (line.type) {
    case 'h1':
      return (
        <Box marginTop={1}>
          <Text bold color={colors.primary}>{'# '}</Text>
          <Text bold color={colors.primary}><InlineText text={line.content} /></Text>
        </Box>
      )
    case 'h2':
      return (
        <Box marginTop={1}>
          <Text bold color={colors.secondary}>{'## '}</Text>
          <Text bold color={colors.secondary}><InlineText text={line.content} /></Text>
        </Box>
      )
    case 'h3':
      return (
        <Box>
          <Text bold color={colors.info}>{'### '}</Text>
          <Text bold color={colors.info}><InlineText text={line.content} /></Text>
        </Box>
      )
    case 'paragraph':
      return (
        <Box>
          <Text><InlineText text={line.content} /></Text>
        </Box>
      )
    case 'bullet':
      return (
        <Box>
          <Text>{' '.repeat((line.indent ?? 0) * 2)}</Text>
          <Text color={colors.success}>  * </Text>
          <Text><InlineText text={line.content} /></Text>
        </Box>
      )
    case 'numbered':
      return (
        <Box>
          <Text>{' '.repeat((line.indent ?? 0) * 2)}</Text>
          <Text color={colors.success}>  {line.num}. </Text>
          <Text><InlineText text={line.content} /></Text>
        </Box>
      )
    case 'blockquote':
      return (
        <Box>
          <Text color="gray">  | </Text>
          <Text italic dimColor><InlineText text={line.content} /></Text>
        </Box>
      )
    case 'code':
      return (
        <Box>
          <Text color={colors.warning}>    {line.content}</Text>
        </Box>
      )
    case 'code_fence':
      return (
        <Box flexDirection="column" marginY={0}>
          {line.lang && <Text dimColor>  {'['}{line.lang}{']'}</Text>}
          {line.content.split('\n').map((cl, i) => (
            <Box key={i}>
              <Text dimColor>  </Text>
              <Text color={colors.warning}>{cl}</Text>
            </Box>
          ))}
        </Box>
      )
    case 'hr':
      return (
        <Box marginY={0}>
          <Text dimColor>{'  ' + '─'.repeat(40)}</Text>
        </Box>
      )
    case 'blank':
      return <Box><Text> </Text></Box>
    default:
      return null
  }
}

const DEMO_DOCS = [
  {
    title: 'README.md',
    content: `# ink-web-ui

A component library for building **terminal-style interfaces** in the browser.

## Installation

\`\`\`bash
npm install ink-web ink-web-ui
\`\`\`

## Quick Start

Import a component and render it inside \`InkTerminalBox\`:

\`\`\`tsx
import { LogViewer } from "ink-web-ui"
import { InkTerminalBox } from "ink-web"

export default function App() {
  return (
    <InkTerminalBox rows={24}>
      <LogViewer />
    </InkTerminalBox>
  )
}
\`\`\`

## Features

- **Real terminal rendering** via xterm.js
- **React components** using the Ink component model
- **Works everywhere** in both terminal and browser
- Keyboard-driven interactions with ~~mouse~~ full keyboard support

> Built on top of ink-web, which brings Ink to the browser.

---

### Links

See the [documentation](https://ink-web-ui.dev) for the full component list.`,
  },
  {
    title: 'CHANGELOG.md',
    content: `# Changelog

## v0.3.0

### New Components

- **LogViewer** with real-time streaming and level filtering
- **DiffViewer** with hunk-level accept/reject
- **TokenUsage** dashboard for LLM cost tracking

### Improvements

- Switched all components to \`useReducer\` for cleaner state
- Fixed stale closure bug in *TaskList* delete handler
- Added \`InkTerminalBox\` support with configurable \`rows\`

> This release focuses on AI-specific components.

## v0.2.0

- Added **AgentWorkflow** component
- Added **VoiceRecognition** with Web Audio API
- Fixed PomodoroTimer layout at small terminal sizes

## v0.1.0

- Initial release with \`TaskList\`, \`PomodoroTimer\`, \`SystemMonitor\`
- Documentation site with live demos
- Built on ***ink-web*** runtime`,
  },
  {
    title: 'API.md',
    content: `# API Reference

## Components

### LogViewer

Renders a streaming log viewer with filtering.

\`\`\`tsx
<LogViewer
  entries={logEntries}
  maxBuffer={200}
  onFilter={(level) => void}
/>
\`\`\`

**Props:**

- \`entries\` - Array of \`LogEntry\` objects
- \`maxBuffer\` - Max entries to keep (default: \`200\`)
- \`showTimestamps\` - Show timestamps (default: \`true\`)

### DataTable

Interactive table with sorting and filtering.

\`\`\`tsx
<DataTable
  columns={[
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
  ]}
  rows={data}
/>
\`\`\`

---

## Hooks

### useTerminalTheme

Returns the current terminal color scheme:

\`\`\`tsx
const theme = useTerminalTheme()
// theme.primary, theme.error, theme.muted
\`\`\`

> All components respect the active theme.`,
  },
]

const VISIBLE = 18

export function MarkdownRenderer() {
  const [docIndex, setDocIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)

  const doc = DEMO_DOCS[docIndex]!
  const parsed = parseMd(doc.content)

  useInput((ch, key) => {
    if (key.tab) {
      setDocIndex((docIndex + 1) % DEMO_DOCS.length)
      setScrollOffset(0)
    } else if (ch === 'j' || key.downArrow) {
      setScrollOffset(Math.min(scrollOffset + 1, Math.max(0, parsed.length - VISIBLE)))
    } else if (ch === 'k' || key.upArrow) {
      setScrollOffset(Math.max(0, scrollOffset - 1))
    } else if (ch === 'G') {
      setScrollOffset(Math.max(0, parsed.length - VISIBLE))
    } else if (ch === 'g') {
      setScrollOffset(0)
    }
  })

  const visible = parsed.slice(scrollOffset, scrollOffset + VISIBLE)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={3}>
        {DEMO_DOCS.map((d, i) => (
          <Text key={d.title} color={i === docIndex ? 'white' : 'gray'} bold={i === docIndex}>
            {d.title}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column">
        {visible.map((line, i) => (
          <RenderLine key={scrollOffset + i} line={line} />
        ))}
      </Box>

      {parsed.length > VISIBLE && (
        <Text dimColor>
          {scrollOffset + 1}-{Math.min(scrollOffset + VISIBLE, parsed.length)} of {parsed.length} lines
        </Text>
      )}

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> j/k </Text>
          <Text dimColor> scroll</Text>
        </Box>
        <Box>
          <Text inverse bold> g/G </Text>
          <Text dimColor> top/bottom</Text>
        </Box>
        <Box>
          <Text inverse bold> tab </Text>
          <Text dimColor> next doc</Text>
        </Box>
      </Box>
    </Box>
  )
}
