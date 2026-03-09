import { useReducer, useEffect, useRef, useState } from 'react'
import { Box, Text, useInput, useStdout } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

type Layout = 'horizontal' | 'vertical'
type Pane = 'left' | 'right'

interface FileEntry {
  name: string
  ext: string
  size: string
  preview: string[]
}

interface State {
  layout: Layout
  activePane: Pane
  splitRatio: number
  resizeMode: boolean
  fileCursor: number
  previewScroll: number
}

type Action =
  | { type: 'toggle_layout' }
  | { type: 'switch_pane' }
  | { type: 'enter_resize' }
  | { type: 'exit_resize' }
  | { type: 'resize_left' }
  | { type: 'resize_right' }
  | { type: 'move_up' }
  | { type: 'move_down'; max: number; maxScroll: number }

/* ── Demo data ── */

const FILES: FileEntry[] = [
  { name: 'index.ts', ext: 'ts', size: '0.3k', preview: ['export { App } from "./App";', 'export { Router } from "./router";', 'export { Config } from "./config";', 'export type { AppProps } from "./types";', '', '// Re-export utilities', 'export * from "./utils";'] },
  { name: 'App.tsx', ext: 'tsx', size: '0.4k', preview: ['import React from "react";', 'import { Router } from "./router";', 'import { ThemeProvider } from "./theme";', '', 'export function App() {', '  return (', '    <ThemeProvider>', '      <Router />', '    </ThemeProvider>', '  );', '}'] },
  { name: 'router.ts', ext: 'ts', size: '0.5k', preview: ['import { createRouter } from "@tanstack/router";', '', 'const routes = [', '  { path: "/", component: Home },', '  { path: "/about", component: About },', '  { path: "/settings", component: Settings },', '];', '', 'export const router = createRouter({ routes });'] },
  { name: 'package.json', ext: 'json', size: '0.6k', preview: ['{', '  "name": "my-project",', '  "version": "1.0.0",', '  "scripts": {', '    "dev": "vite",', '    "build": "tsc && vite build",', '    "test": "vitest"', '  },', '  "dependencies": {', '    "react": "^18.2.0",', '    "react-dom": "^18.2.0"', '  }', '}'] },
  { name: 'tsconfig.json', ext: 'json', size: '0.4k', preview: ['{', '  "compilerOptions": {', '    "target": "ES2022",', '    "module": "ESNext",', '    "strict": true,', '    "jsx": "react-jsx",', '    "outDir": "./dist"', '  },', '  "include": ["src"]', '}'] },
  { name: 'README.md', ext: 'md', size: '0.8k', preview: ['# My Project', '', 'A modern web application built with React.', '', '## Getting Started', '', '```bash', 'npm install', 'npm run dev', '```', '', '## Features', '', '- Fast HMR with Vite', '- TypeScript support', '- Component library'] },
  { name: 'utils.ts', ext: 'ts', size: '0.6k', preview: ['export function debounce<T extends (...args: any[]) => void>(', '  fn: T,', '  ms: number', '): T {', '  let timer: NodeJS.Timeout;', '  return ((...args: any[]) => {', '    clearTimeout(timer);', '    timer = setTimeout(() => fn(...args), ms);', '  }) as T;', '}', '', 'export function clamp(n: number, min: number, max: number) {', '  return Math.min(max, Math.max(min, n));', '}'] },
  { name: 'types.ts', ext: 'ts', size: '0.3k', preview: ['export interface User {', '  id: string;', '  name: string;', '  email: string;', '  role: "admin" | "user";', '}', '', 'export interface AppProps {', '  theme?: "light" | "dark";', '  debug?: boolean;', '}'] },
  { name: 'config.ts', ext: 'ts', size: '0.3k', preview: ['export const config = {', '  apiUrl: process.env.API_URL ?? "http://localhost:3000",', '  debug: process.env.NODE_ENV === "development",', '  maxRetries: 3,', '  timeout: 5000,', '};'] },
  { name: 'Dockerfile', ext: '', size: '0.4k', preview: ['FROM node:20-alpine AS builder', 'WORKDIR /app', 'COPY package*.json ./', 'RUN npm ci', 'COPY . .', 'RUN npm run build', '', 'FROM node:20-alpine', 'WORKDIR /app', 'COPY --from=builder /app/dist ./dist', 'CMD ["node", "dist/index.js"]'] },
]

function extColor(ext: string, colors: ReturnType<typeof useTheme>): string | undefined {
  if (ext === 'ts' || ext === 'tsx') return colors.info
  if (ext === 'json') return colors.warning
  if (ext === 'md') return colors.secondary
  return undefined
}

/* ── Reducer ── */

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'toggle_layout':
      return { ...state, layout: state.layout === 'horizontal' ? 'vertical' : 'horizontal' }
    case 'switch_pane':
      return { ...state, activePane: state.activePane === 'left' ? 'right' : 'left' }
    case 'enter_resize':
      return { ...state, resizeMode: true }
    case 'exit_resize':
      return { ...state, resizeMode: false }
    case 'resize_left':
      return { ...state, splitRatio: Math.max(20, state.splitRatio - 5) }
    case 'resize_right':
      return { ...state, splitRatio: Math.min(80, state.splitRatio + 5) }
    case 'move_up':
      if (state.activePane === 'left')
        return { ...state, fileCursor: Math.max(0, state.fileCursor - 1), previewScroll: 0 }
      return { ...state, previewScroll: Math.max(0, state.previewScroll - 1) }
    case 'move_down':
      if (state.activePane === 'left')
        return { ...state, fileCursor: Math.min(action.max - 1, state.fileCursor + 1), previewScroll: 0 }
      return { ...state, previewScroll: Math.min(action.maxScroll, state.previewScroll + 1) }
  }
}

/* ── Sub-components ── */

function FileList({ files, cursor, active, height, colors, resizeMode }: {
  files: FileEntry[]; cursor: number; active: boolean; height: number; colors: ReturnType<typeof useTheme>; resizeMode: boolean
}) {
  const maxVis = Math.max(1, height - 3)
  const scrollOff = Math.max(0, Math.min(cursor - maxVis + 2, files.length - maxVis))
  const visible = files.slice(scrollOff, scrollOff + maxVis)
  const accentColor = active ? colors.primary : '#555555'

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Pane title */}
      <Box gap={1} marginBottom={1}>
        <Text bold dimColor={resizeMode} color={!resizeMode ? accentColor : undefined}>Explorer</Text>
        <Text dimColor>{files.length} files</Text>
      </Box>

      {visible.map((f, i) => {
        const idx = scrollOff + i
        const sel = idx === cursor
        const ec = extColor(f.ext, colors)

        return (
          <Box key={f.name} gap={1}>
            <Text color={sel && active && !resizeMode ? colors.primary : sel ? 'white' : '#555555'}>{sel ? '▸' : ' '}</Text>
            <Text
              color={sel && active && !resizeMode ? colors.primary : 'white'}
              bold={sel}
            >
              {f.name}
            </Text>
          </Box>
        )
      })}

      {files.length > maxVis && (
        <Box marginTop={1}>
          <Text dimColor>{scrollOff + 1}–{Math.min(scrollOff + maxVis, files.length)} of {files.length}</Text>
        </Box>
      )}
    </Box>
  )
}

function Preview({ file, active, height, scroll, colors, resizeMode }: {
  file: FileEntry | undefined; active: boolean; height: number; scroll: number; colors: ReturnType<typeof useTheme>; resizeMode: boolean
}) {
  if (!file) {
    return (
      <Box flexDirection="column" flexGrow={1}>
        <Text dimColor>Select a file</Text>
      </Box>
    )
  }

  const maxVis = Math.max(1, height - 3)
  const lines = file.preview.slice(scroll, scroll + maxVis)
  const accentColor = active ? colors.primary : '#555555'
  const ec = extColor(file.ext, colors)

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Pane title */}
      <Box gap={1} marginBottom={1}>
        <Text color={active && !resizeMode ? colors.primary : 'white'} bold>{file.name}</Text>
        <Text dimColor>{file.ext || 'file'}</Text>
        <Text dimColor>·</Text>
        <Text dimColor>{file.preview.length} lines</Text>
      </Box>

      {lines.map((line, i) => (
        <Box key={i + scroll} gap={0}>
          <Box width={4}>
            <Text dimColor>{String(scroll + i + 1).padStart(3)} </Text>
          </Box>
          <Text dimColor={!active}>{line}</Text>
        </Box>
      ))}

      {file.preview.length > maxVis && (
        <Box marginTop={1}>
          <Text dimColor>{scroll + 1}–{Math.min(scroll + maxVis, file.preview.length)} of {file.preview.length}</Text>
        </Box>
      )}
    </Box>
  )
}

/* ── Main ── */

export function SplitPanes() {
  const colors = useTheme()
  const { stdout } = useStdout()
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)

  const [state, dispatch] = useReducer(reducer, {
    layout: 'horizontal' as Layout,
    activePane: 'left' as Pane,
    splitRatio: 35,
    resizeMode: false,
    fileCursor: 0,
    previewScroll: 0,
  })

  const { layout, activePane, splitRatio, resizeMode, fileCursor, previewScroll } = state
  const selectedFile = FILES[fileCursor]
  const totalHeight = 18
  const topHeight = layout === 'horizontal' ? totalHeight : Math.round(totalHeight * splitRatio / 100)
  const bottomHeight = layout === 'horizontal' ? totalHeight : totalHeight - topHeight

  useEffect(() => {
    mountedRef.current = true
    const id = setTimeout(() => {
      if (mountedRef.current) { stdout.write('\x1b[2J\x1b[H'); setReady(true) }
    }, 300)
    return () => { mountedRef.current = false; clearTimeout(id) }
  }, [])

  useInput((ch, key) => {
    if (resizeMode) {
      if (key.leftArrow || key.upArrow) dispatch({ type: 'resize_left' })
      else if (key.rightArrow || key.downArrow) dispatch({ type: 'resize_right' })
      else if (key.return || key.escape) dispatch({ type: 'exit_resize' })
      return
    }

    if (key.tab) dispatch({ type: 'switch_pane' })
    else if (ch === 'v') dispatch({ type: 'toggle_layout' })
    else if (ch === 'r') dispatch({ type: 'enter_resize' })
    else if (key.upArrow || ch === 'k') dispatch({ type: 'move_up' })
    else if (key.downArrow || ch === 'j') {
      const maxScroll = selectedFile ? Math.max(0, selectedFile.preview.length - bottomHeight + 3) : 0
      dispatch({ type: 'move_down', max: FILES.length, maxScroll })
    }
  })

  if (!ready) return <Box />

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Panes */}
      <Box flexDirection={layout === 'horizontal' ? 'row' : 'column'}>
        {/* Left pane */}
        <Box flexDirection="column" flexGrow={1} flexBasis={`${splitRatio}%`}>
          <FileList files={FILES} cursor={fileCursor} active={activePane === 'left'} height={topHeight} colors={colors} resizeMode={resizeMode} />
        </Box>

        {/* Divider */}
        {layout === 'horizontal' ? (
          <Box flexDirection="column" width={3} alignItems="center">
            {Array.from({ length: totalHeight }).map((_, i) => (
              <Text key={i} color={resizeMode ? colors.primary : '#333333'}>│</Text>
            ))}
          </Box>
        ) : (
          <Box height={1} overflow="hidden">
            <Text color={resizeMode ? colors.primary : '#333333'} wrap="truncate">{'─'.repeat(200)}</Text>
          </Box>
        )}

        {/* Right pane */}
        <Box flexDirection="column" flexGrow={1} flexBasis={`${100 - splitRatio}%`}>
          <Preview file={selectedFile} active={activePane === 'right'} height={bottomHeight} scroll={previewScroll} colors={colors} resizeMode={resizeMode} />
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1} gap={2}>
        {resizeMode ? (
          <>
            <Box><Text color={colors.warning} bold inverse> RESIZE {splitRatio}:{100 - splitRatio} </Text></Box>
            <Box><Text inverse bold> arrows </Text><Text dimColor> adjust</Text></Box>
            <Box><Text inverse bold> enter </Text><Text dimColor> done</Text></Box>
          </>
        ) : (
          <>
            <Box><Text inverse bold> tab </Text><Text dimColor> pane</Text></Box>
            <Box><Text inverse bold> j/k </Text><Text dimColor> navigate</Text></Box>
            <Box><Text inverse bold> v </Text><Text dimColor> layout</Text></Box>
            <Box><Text inverse bold> r </Text><Text dimColor> resize</Text></Box>
          </>
        )}
      </Box>
    </Box>
  )
}
