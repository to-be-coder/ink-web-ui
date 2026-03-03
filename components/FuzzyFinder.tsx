import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface FuzzyResult {
  score: number
  matchedIndices: number[]
}

function fuzzyScore(query: string, candidate: string): FuzzyResult | null {
  if (!query) return { score: 0, matchedIndices: [] }

  const qLower = query.toLowerCase()
  const cLower = candidate.toLowerCase()
  const matchedIndices: number[] = []
  let lastPos = -1

  for (let qi = 0; qi < qLower.length; qi++) {
    let found = false
    for (let ci = lastPos + 1; ci < cLower.length; ci++) {
      if (cLower[ci] === qLower[qi]) {
        matchedIndices.push(ci)
        lastPos = ci
        found = true
        break
      }
    }
    if (!found) return null
  }

  // Calculate score
  let score = 0

  for (let i = 0; i < matchedIndices.length; i++) {
    // Base score per match
    score += 16

    const idx = matchedIndices[i]!
    const ch = candidate[idx]!

    // Word boundary bonus
    if (idx === 0) {
      score += 10
    } else {
      const prev = candidate[idx - 1]!
      if (prev === ' ' || prev === '/' || prev === '.' || prev === '-' || prev === '_') {
        score += 10
      }
    }

    // Consecutive match bonus
    if (i > 0 && matchedIndices[i]! - matchedIndices[i - 1]! === 1) {
      score += 8
    }

    // camelCase transition bonus
    if (idx > 0) {
      const prev = candidate[idx - 1]!
      if (prev === prev.toLowerCase() && ch === ch.toUpperCase() && ch !== ch.toLowerCase()) {
        score += 5
      }
    }
  }

  // Penalize gaps
  for (let i = 1; i < matchedIndices.length; i++) {
    const gap = matchedIndices[i]! - matchedIndices[i - 1]! - 1
    score -= gap
  }

  return { score, matchedIndices }
}

interface FileItem {
  path: string
  language: string
  content: string[]
}

const FILE_ITEMS: FileItem[] = [
  {
    path: 'src/components/Button.tsx',
    language: 'TypeScript',
    content: [
      'import React from "react";',
      '',
      'interface ButtonProps {',
      '  label: string;',
      '  variant?: "primary" | "secondary";',
      '  onClick?: () => void;',
      '  disabled?: boolean;',
      '}',
      '',
      'export function Button({ label, variant = "primary", onClick, disabled }: ButtonProps) {',
      '  return (',
      '    <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>',
      '      {label}',
      '    </button>',
      '  );',
      '}',
    ],
  },
  {
    path: 'src/components/Input.tsx',
    language: 'TypeScript',
    content: [
      'import React, { useState } from "react";',
      '',
      'interface InputProps {',
      '  placeholder?: string;',
      '  value: string;',
      '  onChange: (val: string) => void;',
      '}',
      '',
      'export function Input({ placeholder, value, onChange }: InputProps) {',
      '  return <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />;',
      '}',
    ],
  },
  {
    path: 'src/components/Modal.tsx',
    language: 'TypeScript',
    content: [
      'import React from "react";',
      '',
      'interface ModalProps {',
      '  open: boolean;',
      '  onClose: () => void;',
      '  title: string;',
      '  children: React.ReactNode;',
      '}',
      '',
      'export function Modal({ open, onClose, title, children }: ModalProps) {',
      '  if (!open) return null;',
      '  return (',
      '    <div className="modal-overlay" onClick={onClose}>',
      '      <div className="modal-content">{children}</div>',
      '    </div>',
      '  );',
      '}',
    ],
  },
  {
    path: 'src/components/Navbar.tsx',
    language: 'TypeScript',
    content: [
      'import React from "react";',
      'import { Link } from "./Link";',
      '',
      'export function Navbar() {',
      '  return (',
      '    <nav className="navbar">',
      '      <Link href="/">Home</Link>',
      '      <Link href="/about">About</Link>',
      '      <Link href="/contact">Contact</Link>',
      '    </nav>',
      '  );',
      '}',
    ],
  },
  {
    path: 'src/hooks/useDebounce.ts',
    language: 'TypeScript',
    content: [
      'import { useState, useEffect } from "react";',
      '',
      'export function useDebounce<T>(value: T, delay: number): T {',
      '  const [debounced, setDebounced] = useState(value);',
      '',
      '  useEffect(() => {',
      '    const timer = setTimeout(() => setDebounced(value), delay);',
      '    return () => clearTimeout(timer);',
      '  }, [value, delay]);',
      '',
      '  return debounced;',
      '}',
    ],
  },
  {
    path: 'src/hooks/useFetch.ts',
    language: 'TypeScript',
    content: [
      'import { useState, useEffect } from "react";',
      '',
      'export function useFetch<T>(url: string) {',
      '  const [data, setData] = useState<T | null>(null);',
      '  const [loading, setLoading] = useState(true);',
      '  const [error, setError] = useState<Error | null>(null);',
      '',
      '  useEffect(() => {',
      '    fetch(url)',
      '      .then(res => res.json())',
      '      .then(setData)',
      '      .catch(setError)',
      '      .finally(() => setLoading(false));',
      '  }, [url]);',
      '',
      '  return { data, loading, error };',
      '}',
    ],
  },
  {
    path: 'src/hooks/useLocalStorage.ts',
    language: 'TypeScript',
    content: [
      'import { useState, useCallback } from "react";',
      '',
      'export function useLocalStorage<T>(key: string, initial: T) {',
      '  const [value, setValue] = useState<T>(() => {',
      '    const stored = localStorage.getItem(key);',
      '    return stored ? JSON.parse(stored) : initial;',
      '  });',
      '',
      '  const set = useCallback((v: T) => {',
      '    localStorage.setItem(key, JSON.stringify(v));',
      '    setValue(v);',
      '  }, [key]);',
      '',
      '  return [value, set] as const;',
      '}',
    ],
  },
  {
    path: 'src/utils/api.ts',
    language: 'TypeScript',
    content: [
      'const BASE_URL = process.env.API_URL ?? "http://localhost:3000";',
      '',
      'export async function apiGet<T>(path: string): Promise<T> {',
      '  const res = await fetch(`${BASE_URL}${path}`);',
      '  if (!res.ok) throw new Error(`API error: ${res.status}`);',
      '  return res.json();',
      '}',
      '',
      'export async function apiPost<T>(path: string, body: unknown): Promise<T> {',
      '  const res = await fetch(`${BASE_URL}${path}`, {',
      '    method: "POST",',
      '    headers: { "Content-Type": "application/json" },',
      '    body: JSON.stringify(body),',
      '  });',
      '  return res.json();',
      '}',
    ],
  },
  {
    path: 'src/utils/format.ts',
    language: 'TypeScript',
    content: [
      'export function formatDate(date: Date): string {',
      '  return date.toLocaleDateString("en-US", {',
      '    year: "numeric",',
      '    month: "short",',
      '    day: "numeric",',
      '  });',
      '}',
      '',
      'export function formatCurrency(amount: number): string {',
      '  return new Intl.NumberFormat("en-US", {',
      '    style: "currency",',
      '    currency: "USD",',
      '  }).format(amount);',
      '}',
    ],
  },
  {
    path: 'src/utils/validation.ts',
    language: 'TypeScript',
    content: [
      'export function isEmail(value: string): boolean {',
      '  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);',
      '}',
      '',
      'export function isRequired(value: string): boolean {',
      '  return value.trim().length > 0;',
      '}',
      '',
      'export function minLength(value: string, min: number): boolean {',
      '  return value.length >= min;',
      '}',
    ],
  },
  {
    path: 'src/types/index.ts',
    language: 'TypeScript',
    content: [
      'export interface User {',
      '  id: string;',
      '  name: string;',
      '  email: string;',
      '  avatar?: string;',
      '}',
      '',
      'export interface Post {',
      '  id: string;',
      '  title: string;',
      '  body: string;',
      '  authorId: string;',
      '}',
    ],
  },
  {
    path: 'src/styles/globals.css',
    language: 'CSS',
    content: [
      ':root {',
      '  --primary: #3b82f6;',
      '  --secondary: #8b5cf6;',
      '  --bg: #0a0a0a;',
      '  --fg: #ededed;',
      '}',
      '',
      'body {',
      '  margin: 0;',
      '  font-family: system-ui, sans-serif;',
      '  background: var(--bg);',
      '  color: var(--fg);',
      '}',
    ],
  },
  {
    path: 'package.json',
    language: 'JSON',
    content: [
      '{',
      '  "name": "my-app",',
      '  "version": "1.0.0",',
      '  "scripts": {',
      '    "dev": "vite",',
      '    "build": "tsc && vite build",',
      '    "test": "vitest",',
      '    "lint": "eslint src/"',
      '  },',
      '  "dependencies": {',
      '    "react": "^18.2.0"',
      '  }',
      '}',
    ],
  },
  {
    path: 'tsconfig.json',
    language: 'JSON',
    content: [
      '{',
      '  "compilerOptions": {',
      '    "target": "ES2022",',
      '    "module": "ESNext",',
      '    "strict": true,',
      '    "jsx": "react-jsx"',
      '  },',
      '  "include": ["src"]',
      '}',
    ],
  },
  {
    path: 'README.md',
    language: 'Markdown',
    content: [
      '# My App',
      '',
      'A modern web application.',
      '',
      '## Getting Started',
      '',
      '```bash',
      'npm install',
      'npm run dev',
      '```',
      '',
      '## Scripts',
      '',
      '- `dev` - Start development server',
      '- `build` - Production build',
    ],
  },
  {
    path: 'vite.config.ts',
    language: 'TypeScript',
    content: [
      'import { defineConfig } from "vite";',
      'import react from "@vitejs/plugin-react";',
      '',
      'export default defineConfig({',
      '  plugins: [react()],',
      '  server: {',
      '    port: 3000,',
      '  },',
      '  build: {',
      '    outDir: "dist",',
      '  },',
      '});',
    ],
  },
  {
    path: 'src/App.tsx',
    language: 'TypeScript',
    content: [
      'import React from "react";',
      'import { Navbar } from "./components/Navbar";',
      'import { Router } from "./Router";',
      '',
      'export function App() {',
      '  return (',
      '    <div className="app">',
      '      <Navbar />',
      '      <main>',
      '        <Router />',
      '      </main>',
      '    </div>',
      '  );',
      '}',
    ],
  },
  {
    path: 'src/Router.tsx',
    language: 'TypeScript',
    content: [
      'import React from "react";',
      'import { BrowserRouter, Routes, Route } from "react-router-dom";',
      '',
      'export function Router() {',
      '  return (',
      '    <BrowserRouter>',
      '      <Routes>',
      '        <Route path="/" element={<Home />} />',
      '        <Route path="/about" element={<About />} />',
      '      </Routes>',
      '    </BrowserRouter>',
      '  );',
      '}',
    ],
  },
  {
    path: '.eslintrc.json',
    language: 'JSON',
    content: [
      '{',
      '  "extends": [',
      '    "eslint:recommended",',
      '    "plugin:@typescript-eslint/recommended",',
      '    "plugin:react/recommended"',
      '  ],',
      '  "rules": {',
      '    "no-unused-vars": "warn",',
      '    "react/prop-types": "off"',
      '  }',
      '}',
    ],
  },
  {
    path: 'src/components/Card.tsx',
    language: 'TypeScript',
    content: [
      'import React from "react";',
      '',
      'interface CardProps {',
      '  title: string;',
      '  description: string;',
      '  image?: string;',
      '}',
      '',
      'export function Card({ title, description, image }: CardProps) {',
      '  return (',
      '    <div className="card">',
      '      {image && <img src={image} alt={title} />}',
      '      <h3>{title}</h3>',
      '      <p>{description}</p>',
      '    </div>',
      '  );',
      '}',
    ],
  },
  {
    path: 'src/components/Table.tsx',
    language: 'TypeScript',
    content: [
      'import React from "react";',
      '',
      'interface Column<T> {',
      '  key: keyof T;',
      '  label: string;',
      '  width?: number;',
      '}',
      '',
      'interface TableProps<T> {',
      '  columns: Column<T>[];',
      '  data: T[];',
      '}',
      '',
      'export function Table<T>({ columns, data }: TableProps<T>) {',
      '  return <table>{/* ... */}</table>;',
      '}',
    ],
  },
]

interface MatchedItem {
  item: FileItem
  score: number
  matchedIndices: number[]
}

interface State {
  query: string
  cursor: number
  showPreview: boolean
  selected: string | null
}

type Action =
  | { type: 'type_char'; char: string }
  | { type: 'backspace' }
  | { type: 'move_up' }
  | { type: 'move_down'; max: number }
  | { type: 'select'; path: string }
  | { type: 'clear_selection' }
  | { type: 'clear_search' }
  | { type: 'toggle_preview' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'type_char':
      return { ...state, query: state.query + action.char, cursor: 0, selected: null }
    case 'backspace':
      return { ...state, query: state.query.slice(0, -1), cursor: 0, selected: null }
    case 'move_up':
      return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'move_down':
      return { ...state, cursor: Math.min(action.max - 1, state.cursor + 1) }
    case 'select':
      return { ...state, selected: action.path }
    case 'clear_selection':
      return { ...state, selected: null }
    case 'clear_search':
      return { ...state, query: '', cursor: 0, selected: null }
    case 'toggle_preview':
      return { ...state, showPreview: !state.showPreview }
  }
}

function getMatches(query: string, items: FileItem[]): MatchedItem[] {
  if (!query) {
    return items.map(item => ({ item, score: 0, matchedIndices: [] }))
  }

  const results: MatchedItem[] = []
  for (const item of items) {
    const result = fuzzyScore(query, item.path)
    if (result) {
      results.push({ item, score: result.score, matchedIndices: result.matchedIndices })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results
}

function HighlightedPath({
  path,
  indices,
  isActive,
}: {
  path: string
  indices: number[]
  isActive: boolean
}) {
  const colors = useTheme()
  const idxSet = new Set(indices)

  // Split into directory and filename
  const lastSlash = path.lastIndexOf('/')
  const dir = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : ''

  const parts: React.ReactNode[] = []
  let i = 0

  while (i < path.length) {
    if (idxSet.has(i)) {
      let end = i
      while (end < path.length && idxSet.has(end)) end++
      parts.push(
        <Text key={i} color={colors.warning} bold>
          {path.slice(i, end)}
        </Text>
      )
      i = end
    } else {
      let end = i
      while (end < path.length && !idxSet.has(end)) end++
      const segment = path.slice(i, end)
      // Check if the segment is entirely in the dir part, entirely in filename, or spanning
      if (i >= dir.length) {
        // filename part
        parts.push(
          <Text key={i} color={isActive ? 'white' : undefined} bold={isActive}>
            {segment}
          </Text>
        )
      } else {
        parts.push(
          <Text key={i} dimColor={!isActive}>
            {segment}
          </Text>
        )
      }
      i = end
    }
  }

  return <>{parts}</>
}

function PreviewPanel({
  item,
  height,
}: {
  item: FileItem | undefined
  height: number
}) {
  const colors = useTheme()

  if (!item) {
    return (
      <Box flexDirection="column" flexGrow={1}>
        <Text dimColor>No preview</Text>
      </Box>
    )
  }

  const maxLines = Math.max(1, height - 2)
  const lines = item.content.slice(0, maxLines)

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box>
        <Text color={colors.info} bold>{item.language}</Text>
      </Box>
      <Box>
        <Text dimColor>{'\u2500'.repeat(30)}</Text>
      </Box>
      {lines.map((line, i) => (
        <Box key={i}>
          <Text dimColor>{String(i + 1).padStart(3)} </Text>
          <Text>{line}</Text>
        </Box>
      ))}
      {item.content.length > maxLines && (
        <Text dimColor> ...{item.content.length - maxLines} more lines</Text>
      )}
    </Box>
  )
}

const MAX_RESULTS = 10

export function FuzzyFinder() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    query: '',
    cursor: 0,
    showPreview: true,
    selected: null,
  })

  const { query, cursor, showPreview, selected } = state
  const matches = getMatches(query, FILE_ITEMS)
  const visibleMatches = matches.slice(0, MAX_RESULTS)
  const selectedItem = visibleMatches[cursor]

  useInput((ch, key) => {
    if (selected) {
      if (key.escape || key.return) dispatch({ type: 'clear_selection' })
      return
    }

    if (key.escape) {
      if (query) dispatch({ type: 'clear_search' })
      return
    }
    if (key.return) {
      if (selectedItem) dispatch({ type: 'select', path: selectedItem.item.path })
      return
    }
    if (key.upArrow) {
      dispatch({ type: 'move_up' })
      return
    }
    if (key.downArrow) {
      dispatch({ type: 'move_down', max: visibleMatches.length })
      return
    }
    if (key.backspace || key.delete) {
      dispatch({ type: 'backspace' })
      return
    }
    if (ch === 'p' && key.ctrl) {
      dispatch({ type: 'toggle_preview' })
      return
    }
    if (ch && !key.ctrl && !key.meta) {
      dispatch({ type: 'type_char', char: ch })
    }
  })

  if (selected) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>Fuzzy Finder</Text>
        </Box>
        <Box flexDirection="column" alignItems="center" marginTop={2}>
          <Text color={colors.success} bold>Selected:</Text>
          <Text color="white" bold>{selected}</Text>
          <Box marginTop={1}>
            <Text dimColor>Press <Text bold color="white">enter</Text> or <Text bold color="white">esc</Text> to continue</Text>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={0}>
        <Text bold color={colors.primary}>Fuzzy Finder</Text>
        <Text dimColor>  {matches.length}/{FILE_ITEMS.length} files</Text>
      </Box>

      {/* Search input */}
      <Box marginBottom={1} marginTop={1}>
        <Text color={colors.primary} bold>{'\u276F '}</Text>
        <Text>{query}</Text>
        <Text color={colors.primary}>_</Text>
        {!query && <Text dimColor> type to search...</Text>}
      </Box>

      {/* Results + Preview */}
      <Box flexDirection="row">
        {/* Results list */}
        <Box flexDirection="column" flexGrow={showPreview ? 0 : 1} flexBasis={showPreview ? '60%' : '100%'}>
          {visibleMatches.length === 0 && (
            <Text dimColor>  No matches found</Text>
          )}
          {visibleMatches.map((m, i) => {
            const isActive = i === cursor
            return (
              <Box key={m.item.path}>
                <Text color={isActive ? colors.primary : 'gray'}>
                  {isActive ? '\u276F ' : '  '}
                </Text>
                <Box flexGrow={1}>
                  <HighlightedPath
                    path={m.item.path}
                    indices={m.matchedIndices}
                    isActive={isActive}
                  />
                </Box>
                {query && (
                  <Text dimColor> {m.score}</Text>
                )}
              </Box>
            )
          })}
          {matches.length > MAX_RESULTS && (
            <Text dimColor>  ...{matches.length - MAX_RESULTS} more results</Text>
          )}
        </Box>

        {/* Divider */}
        {showPreview && (
          <Box flexDirection="column" width={1} marginX={1}>
            {Array.from({ length: Math.min(MAX_RESULTS + 2, 14) }).map((_, i) => (
              <Text key={i} dimColor>{'\u2502'}</Text>
            ))}
          </Box>
        )}

        {/* Preview pane */}
        {showPreview && (
          <Box flexDirection="column" flexBasis="40%" flexGrow={1}>
            <PreviewPanel
              item={selectedItem?.item}
              height={MAX_RESULTS + 2}
            />
          </Box>
        )}
      </Box>

      {/* Keybinding hints */}
      <Box marginTop={1} gap={1} flexWrap="wrap">
        <Box>
          <Text inverse bold> {'\u2191'}/{'\u2193'} </Text>
          <Text dimColor> navigate</Text>
        </Box>
        <Box>
          <Text inverse bold> enter </Text>
          <Text dimColor> select</Text>
        </Box>
        <Box>
          <Text inverse bold> esc </Text>
          <Text dimColor> clear</Text>
        </Box>
        <Box>
          <Text inverse bold> ctrl+p </Text>
          <Text dimColor> preview</Text>
        </Box>
      </Box>
    </Box>
  )
}
