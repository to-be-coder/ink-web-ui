import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

/* ── Types ── */

type Layout = 'horizontal' | 'vertical'
type Pane = 'left' | 'right'

interface FileEntry {
  name: string
  ext: string
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
  | { type: 'scroll_up' }
  | { type: 'scroll_down'; maxScroll: number }

/* ── Demo data ── */

const FILES: FileEntry[] = [
  { name: 'index.ts', ext: 'ts', preview: ['export { App } from "./App";', 'export { Router } from "./router";', 'export { Config } from "./config";', 'export type { AppProps } from "./types";', '', '// Re-export utilities', 'export * from "./utils";'] },
  { name: 'App.tsx', ext: 'tsx', preview: ['import React from "react";', 'import { Router } from "./router";', 'import { ThemeProvider } from "./theme";', '', 'export function App() {', '  return (', '    <ThemeProvider>', '      <Router />', '    </ThemeProvider>', '  );', '}'] },
  { name: 'router.ts', ext: 'ts', preview: ['import { createRouter } from "@tanstack/router";', '', 'const routes = [', '  { path: "/", component: Home },', '  { path: "/about", component: About },', '  { path: "/settings", component: Settings },', '];', '', 'export const router = createRouter({ routes });'] },
  { name: 'package.json', ext: 'json', preview: ['{', '  "name": "my-project",', '  "version": "1.0.0",', '  "scripts": {', '    "dev": "vite",', '    "build": "tsc && vite build",', '    "test": "vitest"', '  },', '  "dependencies": {', '    "react": "^18.2.0",', '    "react-dom": "^18.2.0"', '  }', '}'] },
  { name: 'tsconfig.json', ext: 'json', preview: ['{', '  "compilerOptions": {', '    "target": "ES2022",', '    "module": "ESNext",', '    "strict": true,', '    "jsx": "react-jsx",', '    "outDir": "./dist"', '  },', '  "include": ["src"]', '}'] },
  { name: 'README.md', ext: 'md', preview: ['# My Project', '', 'A modern web application built with React.', '', '## Getting Started', '', '```bash', 'npm install', 'npm run dev', '```', '', '## Features', '', '- Fast HMR with Vite', '- TypeScript support', '- Component library'] },
  { name: 'utils.ts', ext: 'ts', preview: ['export function debounce<T extends (...args: any[]) => void>(', '  fn: T,', '  ms: number', '): T {', '  let timer: NodeJS.Timeout;', '  return ((...args: any[]) => {', '    clearTimeout(timer);', '    timer = setTimeout(() => fn(...args), ms);', '  }) as T;', '}', '', 'export function clamp(n: number, min: number, max: number) {', '  return Math.min(max, Math.max(min, n));', '}'] },
  { name: 'types.ts', ext: 'ts', preview: ['export interface User {', '  id: string;', '  name: string;', '  email: string;', '  role: "admin" | "user";', '}', '', 'export interface AppProps {', '  theme?: "light" | "dark";', '  debug?: boolean;', '}'] },
  { name: 'config.ts', ext: 'ts', preview: ['export const config = {', '  apiUrl: process.env.API_URL ?? "http://localhost:3000",', '  debug: process.env.NODE_ENV === "development",', '  maxRetries: 3,', '  timeout: 5000,', '};'] },
  { name: 'Dockerfile', ext: '', preview: ['FROM node:20-alpine AS builder', 'WORKDIR /app', 'COPY package*.json ./', 'RUN npm ci', 'COPY . .', 'RUN npm run build', '', 'FROM node:20-alpine', 'WORKDIR /app', 'COPY --from=builder /app/dist ./dist', 'CMD ["node", "dist/index.js"]'] },
]

function fileIcon(ext: string): string {
  if (ext === 'ts' || ext === 'tsx') return '\u{1F4C4}'
  if (ext === 'json') return '\u{1F4E6}'
  if (ext === 'md') return '\u{1F4DD}'
  return '\u{1F4C4}'
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
      return { ...state, splitRatio: Math.max(15, state.splitRatio - 5) }
    case 'resize_right':
      return { ...state, splitRatio: Math.min(85, state.splitRatio + 5) }
    case 'move_up':
      if (state.activePane === 'left')
        return { ...state, fileCursor: Math.max(0, state.fileCursor - 1), previewScroll: 0 }
      return { ...state, previewScroll: Math.max(0, state.previewScroll - 1) }
    case 'move_down':
      if (state.activePane === 'left')
        return { ...state, fileCursor: Math.min(action.max - 1, state.fileCursor + 1), previewScroll: 0 }
      return { ...state, previewScroll: Math.min(action.maxScroll, state.previewScroll + 1) }
    case 'scroll_up':
      return { ...state, previewScroll: Math.max(0, state.previewScroll - 1) }
    case 'scroll_down':
      return { ...state, previewScroll: Math.min(action.maxScroll, state.previewScroll + 1) }
  }
}

/* ── Sub-components ── */

function FileList({ files, cursor, active, height }: { files: FileEntry[]; cursor: number; active: boolean; height: number }) {
  const colors = useTheme()
  const maxVis = Math.max(1, height - 2)
  const scrollOff = Math.max(0, Math.min(cursor - maxVis + 2, files.length - maxVis))
  const visible = files.slice(scrollOff, scrollOff + maxVis)

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box>
        <Text color={active ? colors.primary : 'gray'} bold={active}>
          {active ? '\u25B6 ' : '  '}Files
        </Text>
        {active && <Text color={colors.primary}> (focus)</Text>}
      </Box>
      <Text color={active ? colors.primary : 'gray'} wrap="truncate-end">{'\u2500'.repeat(200)}</Text>
      {visible.map((f, i) => {
        const idx = scrollOff + i
        const sel = idx === cursor
        return (
          <Box key={f.name}>
            <Text color={sel && active ? colors.primary : 'gray'}>{sel ? '\u276F ' : '  '}</Text>
            <Text>{fileIcon(f.ext)} </Text>
            <Text color={sel && active ? 'white' : undefined} bold={sel && active} dimColor={!sel && !active}>
              {f.name}
            </Text>
          </Box>
        )
      })}
      {files.length > maxVis && (
        <Box><Text dimColor> [{scrollOff + 1}-{Math.min(scrollOff + maxVis, files.length)}/{files.length}]</Text></Box>
      )}
    </Box>
  )
}

function Preview({ file, active, height, scroll }: { file: FileEntry | undefined; active: boolean; height: number; scroll: number }) {
  const colors = useTheme()
  if (!file) return <Box flexDirection="column" flexGrow={1}><Text dimColor>No file selected</Text></Box>

  const maxVis = Math.max(1, height - 2)
  const lines = file.preview.slice(scroll, scroll + maxVis)

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box>
        <Text color={active ? colors.primary : 'gray'} bold={active}>
          {active ? '\u25B6 ' : '  '}Preview: {file.name}
        </Text>
        {active && <Text color={colors.primary}> (focus)</Text>}
      </Box>
      <Text color={active ? colors.primary : 'gray'} wrap="truncate-end">{'\u2500'.repeat(200)}</Text>
      {lines.map((line, i) => (
        <Box key={i}>
          <Text dimColor>{String(scroll + i + 1).padStart(3)} </Text>
          <Text color={active ? undefined : 'gray'}>{line}</Text>
        </Box>
      ))}
      {file.preview.length > maxVis && (
        <Box><Text dimColor> [line {scroll + 1}-{Math.min(scroll + maxVis, file.preview.length)}/{file.preview.length}]</Text></Box>
      )}
    </Box>
  )
}

function VDivider({ height, resizeMode, ratio }: { height: number; resizeMode: boolean; ratio: string }) {
  const colors = useTheme()
  const c = resizeMode ? colors.primary : 'gray'
  const mid = Math.floor(height / 2)
  return (
    <Box flexDirection="column" width={3} alignItems="center">
      {Array.from({ length: height }, (_, i) =>
        i === mid && resizeMode ? (
          <Text key={i} color={c} bold>{ratio}</Text>
        ) : (
          <Text key={i} color={c}>{'\u2502'}</Text>
        ),
      )}
    </Box>
  )
}

function HDivider({ resizeMode, ratio }: { resizeMode: boolean; ratio: string }) {
  const colors = useTheme()
  const c = resizeMode ? colors.primary : 'gray'
  return (
    <Box>
      <Text color={c} wrap="truncate-end">{'\u2500'.repeat(200)}</Text>
      <Text color={c}> {ratio} </Text>
      <Text color={c} wrap="truncate-end">{'\u2500'.repeat(200)}</Text>
    </Box>
  )
}

/* ── Main ── */

export function SplitPanes() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    layout: 'horizontal' as Layout,
    activePane: 'left' as Pane,
    splitRatio: 50,
    resizeMode: false,
    fileCursor: 0,
    previewScroll: 0,
  })

  const { layout, activePane, splitRatio, resizeMode, fileCursor, previewScroll } = state
  const selectedFile = FILES[fileCursor]
  const ratioLabel = `${splitRatio}:${100 - splitRatio}`
  const paneHeight = layout === 'horizontal' ? 16 : 7

  useInput((ch, key) => {
    if (resizeMode) {
      if (key.leftArrow) dispatch({ type: 'resize_left' })
      else if (key.rightArrow) dispatch({ type: 'resize_right' })
      else if (key.return || key.escape) dispatch({ type: 'exit_resize' })
      return
    }

    if (key.tab) dispatch({ type: 'switch_pane' })
    else if (ch === 'v') dispatch({ type: 'toggle_layout' })
    else if (ch === 'r' && key.ctrl) dispatch({ type: 'enter_resize' })
    else if (key.upArrow || ch === 'k') dispatch({ type: 'move_up' })
    else if (key.downArrow || ch === 'j') {
      const maxScroll = selectedFile ? Math.max(0, selectedFile.preview.length - paneHeight + 2) : 0
      dispatch({ type: 'move_down', max: FILES.length, maxScroll })
    }
  })

  return (
    <Box flexDirection="column" paddingX={1} overflow="hidden">
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Split Panes</Text>
        <Text dimColor>{layout === 'horizontal' ? 'left/right' : 'top/bottom'}</Text>
        <Text dimColor>{ratioLabel}</Text>
        {resizeMode && <Text color={colors.warning} bold> RESIZE MODE </Text>}
      </Box>

      <Box flexDirection={layout === 'horizontal' ? 'row' : 'column'}>
        <Box flexDirection="column" flexGrow={1} flexBasis={`${splitRatio}%`}>
          <FileList files={FILES} cursor={fileCursor} active={activePane === 'left'} height={paneHeight} />
        </Box>
        {layout === 'horizontal' ? (
          <VDivider height={paneHeight} resizeMode={resizeMode} ratio={ratioLabel} />
        ) : (
          <HDivider resizeMode={resizeMode} ratio={ratioLabel} />
        )}
        <Box flexDirection="column" flexGrow={1} flexBasis={`${100 - splitRatio}%`}>
          <Preview file={selectedFile} active={activePane === 'right'} height={paneHeight} scroll={previewScroll} />
        </Box>
      </Box>

      <Box marginTop={1} gap={1} flexWrap="wrap">
        <Box><Text inverse bold> tab </Text><Text dimColor> pane</Text></Box>
        <Box><Text inverse bold> v </Text><Text dimColor> layout</Text></Box>
        <Box><Text inverse bold> ctrl+r </Text><Text dimColor> resize</Text></Box>
        <Box><Text inverse bold> {'\u2191'}/{'\u2193'} </Text><Text dimColor> navigate</Text></Box>
        {resizeMode && <Box><Text inverse bold> {'\u2190'}/{'\u2192'} </Text><Text dimColor> adjust</Text></Box>}
        {resizeMode && <Box><Text inverse bold> enter/esc </Text><Text dimColor> done</Text></Box>}
      </Box>
    </Box>
  )
}
