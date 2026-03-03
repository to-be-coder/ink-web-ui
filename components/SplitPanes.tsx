import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

type Layout = 'horizontal' | 'vertical'
type Pane = 'left' | 'right'

interface FileEntry {
  name: string
  ext: string
  icon: string
  preview: string[]
}

interface State {
  layout: Layout
  activePane: Pane
  splitRatio: number
  resizeMode: boolean
  fileCursor: number
  fileScroll: number
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
  | { type: 'scroll_preview_up' }
  | { type: 'scroll_preview_down'; maxScroll: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'toggle_layout':
      return { ...state, layout: state.layout === 'horizontal' ? 'vertical' : 'horizontal' }
    case 'switch_pane':
      return {
        ...state,
        activePane: state.activePane === 'left' ? 'right' : 'left',
      }
    case 'enter_resize':
      return { ...state, resizeMode: true }
    case 'exit_resize':
      return { ...state, resizeMode: false }
    case 'resize_left':
      return { ...state, splitRatio: Math.max(15, state.splitRatio - 5) }
    case 'resize_right':
      return { ...state, splitRatio: Math.min(85, state.splitRatio + 5) }
    case 'move_up':
      if (state.activePane === 'left') {
        return { ...state, fileCursor: Math.max(0, state.fileCursor - 1), previewScroll: 0 }
      }
      return { ...state, previewScroll: Math.max(0, state.previewScroll - 1) }
    case 'move_down':
      if (state.activePane === 'left') {
        return {
          ...state,
          fileCursor: Math.min(action.max - 1, state.fileCursor + 1),
          previewScroll: 0,
        }
      }
      return { ...state, previewScroll: Math.min(action.maxScroll, state.previewScroll + 1) }
    case 'scroll_preview_up':
      return { ...state, previewScroll: Math.max(0, state.previewScroll - 1) }
    case 'scroll_preview_down':
      return { ...state, previewScroll: Math.min(action.maxScroll, state.previewScroll + 1) }
  }
}

const FILES: FileEntry[] = [
  {
    name: 'index.ts',
    ext: 'ts',
    icon: '\u{1F4C4}',
    preview: [
      'export { App } from "./App";',
      'export { Router } from "./router";',
      'export { Config } from "./config";',
      'export type { AppProps } from "./types";',
      '',
      '// Re-export utilities',
      'export * from "./utils";',
    ],
  },
  {
    name: 'App.tsx',
    ext: 'ts',
    icon: '\u{1F4C4}',
    preview: [
      'import React from "react";',
      'import { Router } from "./router";',
      'import { ThemeProvider } from "./theme";',
      '',
      'export function App() {',
      '  return (',
      '    <ThemeProvider>',
      '      <Router />',
      '    </ThemeProvider>',
      '  );',
      '}',
    ],
  },
  {
    name: 'router.ts',
    ext: 'ts',
    icon: '\u{1F4C4}',
    preview: [
      'import { createRouter } from "@tanstack/router";',
      '',
      'const routes = [',
      '  { path: "/", component: Home },',
      '  { path: "/about", component: About },',
      '  { path: "/settings", component: Settings },',
      '];',
      '',
      'export const router = createRouter({ routes });',
    ],
  },
  {
    name: 'package.json',
    ext: 'json',
    icon: '\u{1F4E6}',
    preview: [
      '{',
      '  "name": "my-project",',
      '  "version": "1.0.0",',
      '  "scripts": {',
      '    "dev": "vite",',
      '    "build": "tsc && vite build",',
      '    "test": "vitest"',
      '  },',
      '  "dependencies": {',
      '    "react": "^18.2.0",',
      '    "react-dom": "^18.2.0"',
      '  }',
      '}',
    ],
  },
  {
    name: 'tsconfig.json',
    ext: 'json',
    icon: '\u{1F4E6}',
    preview: [
      '{',
      '  "compilerOptions": {',
      '    "target": "ES2022",',
      '    "module": "ESNext",',
      '    "strict": true,',
      '    "jsx": "react-jsx",',
      '    "outDir": "./dist"',
      '  },',
      '  "include": ["src"]',
      '}',
    ],
  },
  {
    name: 'README.md',
    ext: 'md',
    icon: '\u{1F4DD}',
    preview: [
      '# My Project',
      '',
      'A modern web application built with React.',
      '',
      '## Getting Started',
      '',
      '```bash',
      'npm install',
      'npm run dev',
      '```',
      '',
      '## Features',
      '',
      '- Fast HMR with Vite',
      '- TypeScript support',
      '- Component library',
    ],
  },
  {
    name: 'utils.ts',
    ext: 'ts',
    icon: '\u{1F4C4}',
    preview: [
      'export function debounce<T extends (...args: any[]) => void>(',
      '  fn: T,',
      '  ms: number',
      '): T {',
      '  let timer: NodeJS.Timeout;',
      '  return ((...args: any[]) => {',
      '    clearTimeout(timer);',
      '    timer = setTimeout(() => fn(...args), ms);',
      '  }) as T;',
      '}',
      '',
      'export function clamp(n: number, min: number, max: number) {',
      '  return Math.min(max, Math.max(min, n));',
      '}',
    ],
  },
  {
    name: 'types.ts',
    ext: 'ts',
    icon: '\u{1F4C4}',
    preview: [
      'export interface User {',
      '  id: string;',
      '  name: string;',
      '  email: string;',
      '  role: "admin" | "user";',
      '}',
      '',
      'export interface AppProps {',
      '  theme?: "light" | "dark";',
      '  debug?: boolean;',
      '}',
    ],
  },
  {
    name: 'config.ts',
    ext: 'ts',
    icon: '\u{1F4C4}',
    preview: [
      'export const config = {',
      '  apiUrl: process.env.API_URL ?? "http://localhost:3000",',
      '  debug: process.env.NODE_ENV === "development",',
      '  maxRetries: 3,',
      '  timeout: 5000,',
      '};',
    ],
  },
  {
    name: 'Dockerfile',
    ext: '',
    icon: '\u{1F4C4}',
    preview: [
      'FROM node:20-alpine AS builder',
      'WORKDIR /app',
      'COPY package*.json ./',
      'RUN npm ci',
      'COPY . .',
      'RUN npm run build',
      '',
      'FROM node:20-alpine',
      'WORKDIR /app',
      'COPY --from=builder /app/dist ./dist',
      'CMD ["node", "dist/index.js"]',
    ],
  },
]

function getFileIcon(ext: string): string {
  switch (ext) {
    case 'ts':
    case 'tsx':
      return '\u{1F4C4}'
    case 'json':
      return '\u{1F4E6}'
    case 'md':
      return '\u{1F4DD}'
    default:
      return '\u{1F4C4}'
  }
}

function FileList({
  files,
  cursor,
  active,
  height,
  title,
}: {
  files: FileEntry[]
  cursor: number
  active: boolean
  height: number
  title: string
}) {
  const colors = useTheme()

  const maxVisible = Math.max(1, height - 2)
  const scrollOffset = Math.max(0, Math.min(cursor - maxVisible + 2, files.length - maxVisible))
  const visible = files.slice(scrollOffset, scrollOffset + maxVisible)

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box>
        <Text
          color={active ? colors.primary : 'gray'}
          bold={active}
        >
          {active ? '\u{25B6} ' : '  '}{title}
        </Text>
        {active && <Text color={colors.primary}> (focus)</Text>}
      </Box>
      <Box>
        <Text color={active ? colors.primary : 'gray'}>
          {'\u2500'.repeat(30)}
        </Text>
      </Box>
      {visible.map((f, i) => {
        const idx = scrollOffset + i
        const isSel = idx === cursor
        const icon = getFileIcon(f.ext)

        return (
          <Box key={f.name}>
            <Text color={isSel && active ? colors.primary : 'gray'}>
              {isSel ? '\u276F ' : '  '}
            </Text>
            <Text>{icon} </Text>
            <Text
              color={isSel && active ? 'white' : undefined}
              bold={isSel && active}
              dimColor={!isSel && !active}
            >
              {f.name}
            </Text>
          </Box>
        )
      })}
      {files.length > maxVisible && (
        <Box>
          <Text dimColor>
            {' '}[{scrollOffset + 1}-{Math.min(scrollOffset + maxVisible, files.length)}/{files.length}]
          </Text>
        </Box>
      )}
    </Box>
  )
}

function PreviewPane({
  file,
  active,
  height,
  scroll,
}: {
  file: FileEntry | undefined
  active: boolean
  height: number
  scroll: number
}) {
  const colors = useTheme()

  if (!file) {
    return (
      <Box flexDirection="column" flexGrow={1}>
        <Text dimColor>No file selected</Text>
      </Box>
    )
  }

  const maxVisible = Math.max(1, height - 2)
  const lines = file.preview.slice(scroll, scroll + maxVisible)

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box>
        <Text
          color={active ? colors.primary : 'gray'}
          bold={active}
        >
          {active ? '\u{25B6} ' : '  '}Preview: {file.name}
        </Text>
        {active && <Text color={colors.primary}> (focus)</Text>}
      </Box>
      <Box>
        <Text color={active ? colors.primary : 'gray'}>
          {'\u2500'.repeat(40)}
        </Text>
      </Box>
      {lines.map((line, i) => (
        <Box key={i}>
          <Text dimColor>{String(scroll + i + 1).padStart(3)} </Text>
          <Text color={active ? undefined : 'gray'}>{line}</Text>
        </Box>
      ))}
      {file.preview.length > maxVisible && (
        <Box>
          <Text dimColor>
            {' '}[line {scroll + 1}-{Math.min(scroll + maxVisible, file.preview.length)}/{file.preview.length}]
          </Text>
        </Box>
      )}
    </Box>
  )
}

function VerticalDivider({
  height,
  resizeMode,
  ratio,
}: {
  height: number
  resizeMode: boolean
  ratio: string
}) {
  const colors = useTheme()
  const divColor = resizeMode ? colors.primary : 'gray'
  const midRow = Math.floor(height / 2)

  return (
    <Box flexDirection="column" width={3} alignItems="center">
      {Array.from({ length: height }).map((_, i) => {
        if (i === midRow && resizeMode) {
          return (
            <Text key={i} color={divColor} bold>
              {ratio}
            </Text>
          )
        }
        return (
          <Text key={i} color={divColor}>
            {'\u2502'}
          </Text>
        )
      })}
    </Box>
  )
}

function HorizontalDivider({
  resizeMode,
  ratio,
}: {
  resizeMode: boolean
  ratio: string
}) {
  const colors = useTheme()
  const divColor = resizeMode ? colors.primary : 'gray'

  return (
    <Box justifyContent="center">
      <Text color={divColor}>
        {'\u2500'.repeat(20)} {ratio} {'\u2500'.repeat(20)}
      </Text>
    </Box>
  )
}

export function SplitPanes() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    layout: 'horizontal' as Layout,
    activePane: 'left' as Pane,
    splitRatio: 50,
    resizeMode: false,
    fileCursor: 0,
    fileScroll: 0,
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
    else if (key.upArrow) {
      dispatch({ type: 'move_up' })
    }
    else if (key.downArrow) {
      if (activePane === 'left') {
        dispatch({ type: 'move_down', max: FILES.length, maxScroll: 0 })
      } else {
        const maxScroll = selectedFile ? Math.max(0, selectedFile.preview.length - paneHeight + 2) : 0
        dispatch({ type: 'move_down', max: FILES.length, maxScroll })
      }
    }
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Split Panes</Text>
        <Text dimColor>{layout === 'horizontal' ? 'left/right' : 'top/bottom'}</Text>
        <Text dimColor>{ratioLabel}</Text>
        {resizeMode && (
          <Text color={colors.warning} bold> RESIZE MODE </Text>
        )}
      </Box>

      <Box flexDirection={layout === 'horizontal' ? 'row' : 'column'}>
        <Box flexDirection="column" flexGrow={1} flexBasis={`${splitRatio}%`}>
          <FileList
            files={FILES}
            cursor={fileCursor}
            active={activePane === 'left'}
            height={paneHeight}
            title="Files"
          />
        </Box>

        {layout === 'horizontal' ? (
          <VerticalDivider
            height={paneHeight}
            resizeMode={resizeMode}
            ratio={ratioLabel}
          />
        ) : (
          <HorizontalDivider
            resizeMode={resizeMode}
            ratio={ratioLabel}
          />
        )}

        <Box flexDirection="column" flexGrow={1} flexBasis={`${100 - splitRatio}%`}>
          <PreviewPane
            file={selectedFile}
            active={activePane === 'right'}
            height={paneHeight}
            scroll={previewScroll}
          />
        </Box>
      </Box>

      <Box marginTop={1} gap={1} flexWrap="wrap">
        <Box>
          <Text inverse bold> tab </Text>
          <Text dimColor> pane</Text>
        </Box>
        <Box>
          <Text inverse bold> v </Text>
          <Text dimColor> layout</Text>
        </Box>
        <Box>
          <Text inverse bold> ctrl+r </Text>
          <Text dimColor> resize</Text>
        </Box>
        <Box>
          <Text inverse bold> {'\u2191'}/{'\u2193'} </Text>
          <Text dimColor> navigate</Text>
        </Box>
        {resizeMode && (
          <Box>
            <Text inverse bold> {'\u2190'}/{'\u2192'} </Text>
            <Text dimColor> adjust</Text>
          </Box>
        )}
        {resizeMode && (
          <Box>
            <Text inverse bold> enter/esc </Text>
            <Text dimColor> done</Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}
