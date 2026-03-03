import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface Tab {
  id: string
  name: string
  closable: boolean
  content: string[]
}

let nextTabId = 100

const INITIAL_TABS: Tab[] = [
  {
    id: 'index',
    name: 'index.tsx',
    closable: true,
    content: [
      'import React from "react";',
      'import { createRoot } from "react-dom/client";',
      'import { App } from "./App";',
      '',
      'const root = createRoot(',
      '  document.getElementById("root")!',
      ');',
      '',
      'root.render(',
      '  <React.StrictMode>',
      '    <App />',
      '  </React.StrictMode>',
      ');',
    ],
  },
  {
    id: 'api',
    name: 'api.ts',
    closable: true,
    content: [
      'const BASE_URL = "/api/v1";',
      '',
      'export async function fetchProjects() {',
      '  const res = await fetch(`${BASE_URL}/projects`);',
      '  if (!res.ok) throw new Error(res.statusText);',
      '  return res.json();',
      '}',
      '',
      'export async function createProject(data: ProjectInput) {',
      '  const res = await fetch(`${BASE_URL}/projects`, {',
      '    method: "POST",',
      '    headers: { "Content-Type": "application/json" },',
      '    body: JSON.stringify(data),',
      '  });',
      '  return res.json();',
      '}',
    ],
  },
  {
    id: 'utils',
    name: 'utils.ts',
    closable: true,
    content: [
      'export function clamp(val: number, min: number, max: number) {',
      '  return Math.max(min, Math.min(max, val));',
      '}',
      '',
      'export function debounce<T extends (...args: any[]) => void>(',
      '  fn: T, ms: number',
      ') {',
      '  let timer: ReturnType<typeof setTimeout>;',
      '  return (...args: Parameters<T>) => {',
      '    clearTimeout(timer);',
      '    timer = setTimeout(() => fn(...args), ms);',
      '  };',
      '}',
    ],
  },
  {
    id: 'config',
    name: 'config.json',
    closable: false,
    content: [
      '{',
      '  "name": "ink-web-demo",',
      '  "version": "1.0.0",',
      '  "private": true,',
      '  "scripts": {',
      '    "dev": "next dev --turbopack",',
      '    "build": "next build",',
      '    "start": "next start"',
      '  },',
      '  "dependencies": {',
      '    "react": "^19.0.0",',
      '    "ink-web": "^1.0.0"',
      '  }',
      '}',
    ],
  },
  {
    id: 'readme',
    name: 'README.md',
    closable: false,
    content: [
      '# ink-web demo',
      '',
      'A demonstration of terminal UI components',
      'rendered in the browser using ink-web.',
      '',
      '## Getting Started',
      '',
      '```bash',
      'npm install',
      'npm run dev',
      '```',
      '',
      'Open http://localhost:3000 to view.',
    ],
  },
  {
    id: 'test',
    name: 'test.ts',
    closable: false,
    content: [
      'import { describe, it, expect } from "vitest";',
      'import { clamp, debounce } from "./utils";',
      '',
      'describe("clamp", () => {',
      '  it("clamps within range", () => {',
      '    expect(clamp(5, 0, 10)).toBe(5);',
      '    expect(clamp(-1, 0, 10)).toBe(0);',
      '    expect(clamp(15, 0, 10)).toBe(10);',
      '  });',
      '});',
      '',
      'describe("debounce", () => {',
      '  it("delays execution", async () => {',
      '    let count = 0;',
      '    const inc = debounce(() => count++, 50);',
      '    inc(); inc(); inc();',
      '    expect(count).toBe(0);',
      '  });',
      '});',
    ],
  },
]

interface State {
  tabs: Tab[]
  activeIndex: number
  scrollOffset: number
}

type Action =
  | { type: 'next_tab' }
  | { type: 'prev_tab' }
  | { type: 'go_to_tab'; index: number }
  | { type: 'close_tab' }
  | { type: 'add_tab' }

function reducer(state: State, action: Action): State {
  const { tabs, activeIndex } = state

  switch (action.type) {
    case 'next_tab':
      if (tabs.length === 0) return state
      return {
        ...state,
        activeIndex: (activeIndex + 1) % tabs.length,
      }
    case 'prev_tab':
      if (tabs.length === 0) return state
      return {
        ...state,
        activeIndex: (activeIndex - 1 + tabs.length) % tabs.length,
      }
    case 'go_to_tab': {
      if (action.index < 0 || action.index >= tabs.length) return state
      return { ...state, activeIndex: action.index }
    }
    case 'close_tab': {
      const tab = tabs[activeIndex]
      if (!tab || !tab.closable) return state
      const newTabs = tabs.filter((_, i) => i !== activeIndex)
      if (newTabs.length === 0) return { ...state, tabs: newTabs, activeIndex: 0 }
      const newActive = activeIndex >= newTabs.length ? newTabs.length - 1 : activeIndex
      return { ...state, tabs: newTabs, activeIndex: newActive }
    }
    case 'add_tab': {
      const id = `untitled-${nextTabId++}`
      const newTab: Tab = {
        id,
        name: 'untitled.txt',
        closable: true,
        content: [
          '// New file',
          '// Start typing...',
          '',
        ],
      }
      const newTabs = [...tabs, newTab]
      return { ...state, tabs: newTabs, activeIndex: newTabs.length - 1 }
    }
  }
}

const MAX_VISIBLE_TABS = 5

export function Tabs() {
  const colors = useTheme()

  const [state, dispatch] = useReducer(reducer, {
    tabs: INITIAL_TABS,
    activeIndex: 0,
    scrollOffset: 0,
  })

  const { tabs, activeIndex } = state

  useInput((ch, key) => {
    if (ch === 'l' || key.rightArrow) {
      dispatch({ type: 'next_tab' })
    } else if (ch === 'h' || key.leftArrow) {
      dispatch({ type: 'prev_tab' })
    } else if (ch === 'w') {
      dispatch({ type: 'close_tab' })
    } else if (ch === 'n') {
      dispatch({ type: 'add_tab' })
    } else if (ch && ch >= '1' && ch <= '9') {
      dispatch({ type: 'go_to_tab', index: parseInt(ch, 10) - 1 })
    }
  })

  // Calculate visible tab window
  let visStart = 0
  if (tabs.length > MAX_VISIBLE_TABS) {
    // Keep activeIndex visible within the window
    visStart = Math.max(0, Math.min(activeIndex - Math.floor(MAX_VISIBLE_TABS / 2), tabs.length - MAX_VISIBLE_TABS))
  }
  const visEnd = Math.min(visStart + MAX_VISIBLE_TABS, tabs.length)
  const visibleTabs = tabs.slice(visStart, visEnd)
  const hiddenBefore = visStart
  const hiddenAfter = tabs.length - visEnd

  const activeTab = tabs[activeIndex]

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Tabs</Text>
        <Text dimColor>{activeIndex + 1}/{tabs.length} tabs</Text>
      </Box>

      {/* Tab bar */}
      <Box>
        {hiddenBefore > 0 && (
          <Text dimColor>{'\u25C0'} +{hiddenBefore} </Text>
        )}
        {visibleTabs.map((tab, i) => {
          const realIndex = visStart + i
          const isActive = realIndex === activeIndex

          return (
            <Box key={tab.id}>
              {i > 0 && <Text dimColor> {'\u2502'} </Text>}
              <Text
                color={isActive ? colors.primary : 'gray'}
                bold={isActive}
                underline={isActive}
              >
                {tab.name}
              </Text>
              {tab.closable && (
                <Text color={isActive ? colors.error : 'gray'} dimColor={!isActive}>
                  {' \u00D7'}
                </Text>
              )}
            </Box>
          )
        })}
        {hiddenAfter > 0 && (
          <Text dimColor> +{hiddenAfter} {'\u25B6'}</Text>
        )}
      </Box>

      {/* Separator line */}
      <Box>
        <Text dimColor>{'\u2500'.repeat(56)}</Text>
      </Box>

      {/* Content area */}
      <Box flexDirection="column" marginTop={1} minHeight={12}>
        {activeTab ? (
          activeTab.content.map((line, i) => (
            <Box key={i}>
              <Text dimColor>{String(i + 1).padStart(3, ' ')} </Text>
              <Text>{line}</Text>
            </Box>
          ))
        ) : (
          <Text dimColor>No tabs open. Press n to create one.</Text>
        )}
      </Box>

      {/* Footer hints */}
      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> h/l </Text>
          <Text dimColor> switch</Text>
        </Box>
        <Box>
          <Text inverse bold> 1-9 </Text>
          <Text dimColor> jump</Text>
        </Box>
        <Box>
          <Text inverse bold> w </Text>
          <Text dimColor> close</Text>
        </Box>
        <Box>
          <Text inverse bold> n </Text>
          <Text dimColor> new</Text>
        </Box>
      </Box>
    </Box>
  )
}
