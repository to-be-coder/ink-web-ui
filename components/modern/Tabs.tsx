import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, HelpFooter, Separator } from './utils'

/* ── Types ── */

interface Tab {
  id: string
  label: string
  icon: string
  closable: boolean
  content: string[]
}

/* ── State ── */

interface State {
  tabs: Tab[]
  activeIdx: number
  tabCount: number
}

type Action =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goto'; idx: number }
  | { type: 'close' }
  | { type: 'new' }
  | { type: 'move_left' }
  | { type: 'move_right' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next': return { ...state, activeIdx: Math.min(state.tabs.length - 1, state.activeIdx + 1) }
    case 'prev': return { ...state, activeIdx: Math.max(0, state.activeIdx - 1) }
    case 'goto': return { ...state, activeIdx: Math.max(0, Math.min(state.tabs.length - 1, action.idx)) }
    case 'close': {
      const tab = state.tabs[state.activeIdx]
      if (!tab?.closable || state.tabs.length <= 1) return state
      const next = state.tabs.filter((_, i) => i !== state.activeIdx)
      return { ...state, tabs: next, activeIdx: Math.min(state.activeIdx, next.length - 1) }
    }
    case 'new': {
      const num = state.tabCount + 1
      const newTab: Tab = {
        id: `new-${num}`, label: `Tab ${num}`, icon: '\u25A0',
        closable: true, content: [`// New tab ${num}`, '// Start typing...'],
      }
      const tabs = [...state.tabs, newTab]
      return { ...state, tabs, activeIdx: tabs.length - 1, tabCount: num }
    }
    case 'move_left': {
      if (state.activeIdx <= 0) return state
      const tabs = [...state.tabs]
      ;[tabs[state.activeIdx - 1], tabs[state.activeIdx]] = [tabs[state.activeIdx]!, tabs[state.activeIdx - 1]!]
      return { ...state, tabs, activeIdx: state.activeIdx - 1 }
    }
    case 'move_right': {
      if (state.activeIdx >= state.tabs.length - 1) return state
      const tabs = [...state.tabs]
      ;[tabs[state.activeIdx], tabs[state.activeIdx + 1]] = [tabs[state.activeIdx + 1]!, tabs[state.activeIdx]!]
      return { ...state, tabs, activeIdx: state.activeIdx + 1 }
    }
  }
}

/* ── Demo data ── */

const INITIAL_TABS: Tab[] = [
  {
    id: 'index', label: 'index.ts', icon: '\u25B6', closable: false,
    content: [
      'import { createApp } from "./app"',
      'import { loadConfig } from "./config"',
      '',
      'const config = loadConfig()',
      'const app = createApp(config)',
      '',
      'app.listen(config.port, () => {',
      '  console.log(`Server running on :${config.port}`)',
      '})',
    ],
  },
  {
    id: 'app', label: 'app.ts', icon: '\u25C6', closable: true,
    content: [
      'import express from "express"',
      'import { routes } from "./routes"',
      '',
      'export function createApp(config: Config) {',
      '  const app = express()',
      '  app.use(express.json())',
      '  app.use("/api", routes)',
      '  return app',
      '}',
    ],
  },
  {
    id: 'config', label: 'config.ts', icon: '\u2699', closable: true,
    content: [
      'export interface Config {',
      '  port: number',
      '  dbUrl: string',
      '  debug: boolean',
      '}',
      '',
      'export function loadConfig(): Config {',
      '  return {',
      '    port: Number(process.env.PORT) || 3000,',
      '    dbUrl: process.env.DATABASE_URL ?? "",',
      '    debug: process.env.DEBUG === "true",',
      '  }',
      '}',
    ],
  },
  {
    id: 'routes', label: 'routes.ts', icon: '\u21C4', closable: true,
    content: [
      'import { Router } from "express"',
      '',
      'export const routes = Router()',
      '',
      'routes.get("/health", (_, res) => {',
      '  res.json({ status: "ok" })',
      '})',
      '',
      'routes.get("/users", async (_, res) => {',
      '  const users = await db.users.findMany()',
      '  res.json(users)',
      '})',
    ],
  },
]

/* ── Main ── */

export function ModernTabs() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, { tabs: INITIAL_TABS, activeIdx: 0, tabCount: INITIAL_TABS.length })
  const { tabs, activeIdx } = state
  const activeTab = tabs[activeIdx]!

  useInput((ch, key) => {
    if (key.leftArrow && key.shift) dispatch({ type: 'move_left' })
    else if (key.rightArrow && key.shift) dispatch({ type: 'move_right' })
    else if (key.leftArrow || ch === 'h') dispatch({ type: 'prev' })
    else if (key.rightArrow || ch === 'l') dispatch({ type: 'next' })
    else if (ch === 'w') dispatch({ type: 'close' })
    else if (ch === 'n') dispatch({ type: 'new' })
    else if (ch >= '1' && ch <= '9') dispatch({ type: 'goto', idx: parseInt(ch) - 1 })
  })

  const MAX_VISIBLE = 5
  let tabStart = Math.max(0, activeIdx - Math.floor(MAX_VISIBLE / 2))
  if (tabStart + MAX_VISIBLE > tabs.length) tabStart = Math.max(0, tabs.length - MAX_VISIBLE)
  const visibleTabs = tabs.slice(tabStart, tabStart + MAX_VISIBLE)
  const hasLeft = tabStart > 0
  const hasRight = tabStart + MAX_VISIBLE < tabs.length

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        {/* Tab bar */}
        <Box gap={0} marginBottom={0}>
          {hasLeft && <Text dimColor>{'\u25C0 '}</Text>}
          {visibleTabs.map((tab, vi) => {
            const realIdx = tabStart + vi
            const active = realIdx === activeIdx
            return (
              <Box key={tab.id}>
                {active ? (
                  <Box>
                    <Text inverse bold color={colors.primary}> {tab.icon} {tab.label} </Text>
                  </Box>
                ) : (
                  <Box>
                    <Text dimColor> {tab.icon} {tab.label} </Text>
                  </Box>
                )}
                {vi < visibleTabs.length - 1 && <Text dimColor>{'\u2502'}</Text>}
              </Box>
            )
          })}
          {hasRight && <Text dimColor>{' \u25B6'}</Text>}
        </Box>

        {/* Active indicator dots */}
        <Box marginBottom={1}>
          {tabs.map((_, i) => (
            <Text key={i} color={i === activeIdx ? colors.primary : 'gray'}>
              {i === activeIdx ? '\u25CF' : '\u00B7'}
            </Text>
          ))}
        </Box>

        <Separator />

        {/* Content */}
        <Box flexDirection="column" marginTop={1}>
          <Box marginBottom={1} gap={1}>
            <Text bold color={colors.primary}>{activeTab.icon}</Text>
            <Text bold>{activeTab.label}</Text>
            {!activeTab.closable && <Text dimColor>(pinned)</Text>}
          </Box>
          {activeTab.content.map((line, i) => (
            <Box key={i} gap={1}>
              <Text dimColor>{(i + 1).toString().padStart(2)}</Text>
              <Text>{line}</Text>
            </Box>
          ))}
        </Box>

        <HelpFooter keys={[
          { key: 'h/l', label: 'switch' },
          { key: '1-9', label: 'jump' },
          { key: 'n', label: 'new' },
          { key: 'w', label: 'close' },
          { key: 'H/L', label: 'reorder' },
        ]} />
      </Card>
    </Box>
  )
}
