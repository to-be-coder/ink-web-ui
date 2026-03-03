import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface TokenSpan {
  text: string
  color?: string
  bold?: boolean
  italic?: boolean
}

interface CodeSample {
  language: string
  filename: string
  code: string
}

interface State {
  sampleIndex: number
  scrollOffset: number
  showLineNumbers: boolean
  copied: boolean
}

type Action =
  | { type: 'next_sample' }
  | { type: 'prev_sample' }
  | { type: 'scroll_up' }
  | { type: 'scroll_down'; max: number }
  | { type: 'toggle_line_numbers' }
  | { type: 'copy' }
  | { type: 'clear_copied' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next_sample':
      return { ...state, sampleIndex: (state.sampleIndex + 1) % SAMPLES.length, scrollOffset: 0, copied: false }
    case 'prev_sample':
      return { ...state, sampleIndex: (state.sampleIndex - 1 + SAMPLES.length) % SAMPLES.length, scrollOffset: 0, copied: false }
    case 'scroll_up':
      return { ...state, scrollOffset: Math.max(0, state.scrollOffset - 1) }
    case 'scroll_down':
      return { ...state, scrollOffset: Math.min(state.scrollOffset + 1, action.max) }
    case 'toggle_line_numbers':
      return { ...state, showLineNumbers: !state.showLineNumbers }
    case 'copy':
      return { ...state, copied: true }
    case 'clear_copied':
      return { ...state, copied: false }
  }
}

// Simple keyword-based syntax highlighting
const JS_KEYWORDS = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'export', 'import', 'from', 'async', 'await', 'new', 'throw', 'try', 'catch', 'switch', 'case', 'break', 'default', 'typeof', 'interface', 'type', 'extends', 'implements'])
const JS_BUILTINS = new Set(['console', 'Math', 'Date', 'Promise', 'Array', 'Object', 'String', 'Number', 'Error', 'Map', 'Set', 'JSON', 'process', 'require'])
const JS_VALUES = new Set(['true', 'false', 'null', 'undefined', 'this', 'super'])

function tokenizeLine(line: string, language: string, colors: ReturnType<typeof useTheme>): TokenSpan[] {
  const spans: TokenSpan[] = []
  let remaining = line

  while (remaining.length > 0) {
    // Single-line comment
    const comment = remaining.match(/^(\/\/.*)/)
    if (comment) {
      spans.push({ text: comment[1]!, color: 'gray', italic: true })
      remaining = remaining.slice(comment[0].length)
      continue
    }

    // Hash comment (python, bash)
    const hashComment = remaining.match(/^(#.*)/)
    if (hashComment && (language === 'python' || language === 'bash' || language === 'sh')) {
      spans.push({ text: hashComment[1]!, color: 'gray', italic: true })
      remaining = remaining.slice(hashComment[0].length)
      continue
    }

    // String (double quote)
    const dblStr = remaining.match(/^("(?:[^"\\]|\\.)*")/)
    if (dblStr) {
      spans.push({ text: dblStr[1]!, color: colors.success })
      remaining = remaining.slice(dblStr[0].length)
      continue
    }

    // String (single quote)
    const sglStr = remaining.match(/^('(?:[^'\\]|\\.)*')/)
    if (sglStr) {
      spans.push({ text: sglStr[1]!, color: colors.success })
      remaining = remaining.slice(sglStr[0].length)
      continue
    }

    // Template literal
    const tmpl = remaining.match(/^(`(?:[^`\\]|\\.)*`)/)
    if (tmpl) {
      spans.push({ text: tmpl[1]!, color: colors.success })
      remaining = remaining.slice(tmpl[0].length)
      continue
    }

    // Number
    const num = remaining.match(/^(\b\d+\.?\d*\b)/)
    if (num) {
      spans.push({ text: num[1]!, color: colors.warning })
      remaining = remaining.slice(num[0].length)
      continue
    }

    // Word (keyword/identifier)
    const word = remaining.match(/^(\w+)/)
    if (word) {
      const w = word[1]!
      if (JS_KEYWORDS.has(w)) {
        spans.push({ text: w, color: colors.secondary, bold: true })
      } else if (JS_BUILTINS.has(w)) {
        spans.push({ text: w, color: colors.primary })
      } else if (JS_VALUES.has(w)) {
        spans.push({ text: w, color: colors.warning, bold: true })
      } else if (w[0] === w[0]!.toUpperCase() && w.length > 1 && /^[A-Z]/.test(w)) {
        spans.push({ text: w, color: colors.primary }) // Types/classes
      } else {
        spans.push({ text: w })
      }
      remaining = remaining.slice(w.length)
      continue
    }

    // Operators and punctuation
    const op = remaining.match(/^([{}()\[\];:.,<>=!&|?+\-*/%@^~]+)/)
    if (op) {
      spans.push({ text: op[1]!, color: 'gray' })
      remaining = remaining.slice(op[0].length)
      continue
    }

    // Whitespace
    const ws = remaining.match(/^(\s+)/)
    if (ws) {
      spans.push({ text: ws[1]! })
      remaining = remaining.slice(ws[0].length)
      continue
    }

    // Fallback: single character
    spans.push({ text: remaining[0]! })
    remaining = remaining.slice(1)
  }

  return spans
}

const SAMPLES: CodeSample[] = [
  {
    language: 'typescript',
    filename: 'src/middleware/rateLimit.ts',
    code: `import { Redis } from "ioredis";

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
}

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<boolean> {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.pexpire(key, config.windowMs);
  }

  return current <= config.maxAttempts;
}

export async function recordFailure(email: string): Promise<void> {
  const key = \`rate:login:\${email}\`;
  await checkRateLimit(key, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
  });
}`,
  },
  {
    language: 'python',
    filename: 'agent/tools.py',
    code: `# AI agent tool execution framework
from typing import Any, Callable
from dataclasses import dataclass

@dataclass
class ToolResult:
    output: str
    success: bool
    tokens_used: int = 0

class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, Callable] = {}

    def register(self, name: str):
        def decorator(func: Callable) -> Callable:
            self._tools[name] = func
            return func
        return decorator

    async def execute(self, name: str, **kwargs: Any) -> ToolResult:
        if name not in self._tools:
            return ToolResult(
                output=f"Unknown tool: {name}",
                success=false,
            )
        try:
            result = await self._tools[name](**kwargs)
            return ToolResult(output=str(result), success=true)
        except Exception as e:
            return ToolResult(output=str(e), success=false)`,
  },
  {
    language: 'bash',
    filename: 'scripts/deploy.sh',
    code: `#!/bin/bash
# Deployment script with rollback support

set -euo pipefail

VERSION=$(git describe --tags --always)
REGISTRY="ghcr.io/acme/api"
IMAGE="$REGISTRY:$VERSION"

echo "Building $IMAGE..."
docker build -t "$IMAGE" .

echo "Running tests..."
docker run --rm "$IMAGE" npm test

echo "Pushing to registry..."
docker push "$IMAGE"

# Deploy with rollback on failure
echo "Deploying $VERSION..."
if kubectl set image deployment/api api="$IMAGE"; then
    kubectl rollout status deployment/api --timeout=120s
    echo "Deploy successful: $VERSION"
else
    echo "Deploy failed, rolling back..."
    kubectl rollout undo deployment/api
    exit 1
fi`,
  },
]

const VISIBLE = 18

export function CodeBlock() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    sampleIndex: 0,
    scrollOffset: 0,
    showLineNumbers: true,
    copied: false,
  })

  const { sampleIndex, scrollOffset, showLineNumbers, copied } = state
  const sample = SAMPLES[sampleIndex]!
  const lines = sample.code.split('\n')
  const lineNumWidth = String(lines.length).length

  useInput((ch, key) => {
    if (key.tab) dispatch({ type: 'next_sample' })
    else if (ch === 'j' || key.downArrow) dispatch({ type: 'scroll_down', max: Math.max(0, lines.length - VISIBLE) })
    else if (ch === 'k' || key.upArrow) dispatch({ type: 'scroll_up' })
    else if (ch === 'l') dispatch({ type: 'toggle_line_numbers' })
    else if (ch === 'c') {
      dispatch({ type: 'copy' })
      setTimeout(() => dispatch({ type: 'clear_copied' }), 2000)
    }
  })

  const visible = lines.slice(scrollOffset, scrollOffset + VISIBLE)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Code Block</Text>
        {SAMPLES.map((s, i) => (
          <Text key={s.filename} color={i === sampleIndex ? 'white' : 'gray'} bold={i === sampleIndex}>
            {s.filename}
          </Text>
        ))}
      </Box>

      <Box gap={1} marginBottom={1}>
        <Text dimColor>[{sample.language}]</Text>
        <Text dimColor>{lines.length} lines</Text>
        {copied && <Text color={colors.success}>copied</Text>}
      </Box>

      <Box flexDirection="column">
        {visible.map((line, i) => {
          const lineNum = scrollOffset + i + 1
          const tokens = tokenizeLine(line, sample.language, colors)
          return (
            <Box key={scrollOffset + i}>
              {showLineNumbers && (
                <Text dimColor>{String(lineNum).padStart(lineNumWidth)} </Text>
              )}
              {tokens.map((token, ti) => (
                <Text key={ti} color={token.color} bold={token.bold} italic={token.italic}>
                  {token.text}
                </Text>
              ))}
            </Box>
          )
        })}
      </Box>

      {lines.length > VISIBLE && (
        <Text dimColor>
          {scrollOffset + 1}-{Math.min(scrollOffset + VISIBLE, lines.length)} of {lines.length}
        </Text>
      )}

      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> tab </Text>
          <Text dimColor> file</Text>
        </Box>
        <Box>
          <Text inverse bold> j/k </Text>
          <Text dimColor> scroll</Text>
        </Box>
        <Box>
          <Text inverse bold> l </Text>
          <Text dimColor> line #</Text>
        </Box>
        <Box>
          <Text inverse bold> c </Text>
          <Text dimColor> copy</Text>
        </Box>
      </Box>
    </Box>
  )
}
