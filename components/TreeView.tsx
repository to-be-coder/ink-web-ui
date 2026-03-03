import { useReducer, useMemo } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface TreeNode {
  id: string
  name: string
  children?: TreeNode[]
}

interface FlatNode {
  id: string
  name: string
  depth: number
  hasChildren: boolean
  expanded: boolean
  isLast: boolean
  parentLasts: boolean[]
  path: string
}

interface State {
  expandedIds: string[]
  cursor: number
  searchQuery: string
  searchMode: boolean
}

type Action =
  | { type: 'move_up' }
  | { type: 'move_down'; max: number }
  | { type: 'expand'; id: string }
  | { type: 'collapse'; id: string }
  | { type: 'toggle'; id: string }
  | { type: 'expand_all'; ids: string[] }
  | { type: 'collapse_all' }
  | { type: 'set_cursor'; cursor: number }
  | { type: 'enter_search' }
  | { type: 'exit_search' }
  | { type: 'search_input'; char: string }
  | { type: 'search_backspace' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'move_up':
      return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'move_down':
      return { ...state, cursor: Math.min(action.max - 1, state.cursor + 1) }
    case 'expand': {
      const set = new Set(state.expandedIds)
      set.add(action.id)
      return { ...state, expandedIds: [...set] }
    }
    case 'collapse': {
      const set = new Set(state.expandedIds)
      set.delete(action.id)
      return { ...state, expandedIds: [...set] }
    }
    case 'toggle': {
      const set = new Set(state.expandedIds)
      if (set.has(action.id)) set.delete(action.id)
      else set.add(action.id)
      return { ...state, expandedIds: [...set] }
    }
    case 'expand_all':
      return { ...state, expandedIds: action.ids }
    case 'collapse_all':
      return { ...state, expandedIds: [], cursor: 0 }
    case 'set_cursor':
      return { ...state, cursor: action.cursor }
    case 'enter_search':
      return { ...state, searchMode: true, searchQuery: '' }
    case 'exit_search':
      return { ...state, searchMode: false, searchQuery: '', cursor: 0 }
    case 'search_input':
      return { ...state, searchQuery: state.searchQuery + action.char, cursor: 0 }
    case 'search_backspace':
      return { ...state, searchQuery: state.searchQuery.slice(0, -1), cursor: 0 }
  }
}

const DEMO_TREE: TreeNode[] = [
  {
    id: 'my-app', name: 'my-app', children: [
      {
        id: 'my-app/src', name: 'src', children: [
          {
            id: 'my-app/src/components', name: 'components', children: [
              { id: 'my-app/src/components/Button.tsx', name: 'Button.tsx' },
              { id: 'my-app/src/components/Input.tsx', name: 'Input.tsx' },
              { id: 'my-app/src/components/Modal.tsx', name: 'Modal.tsx' },
              { id: 'my-app/src/components/index.ts', name: 'index.ts' },
            ],
          },
          {
            id: 'my-app/src/hooks', name: 'hooks', children: [
              { id: 'my-app/src/hooks/useAuth.ts', name: 'useAuth.ts' },
              { id: 'my-app/src/hooks/useApi.ts', name: 'useApi.ts' },
            ],
          },
          {
            id: 'my-app/src/utils', name: 'utils', children: [
              { id: 'my-app/src/utils/format.ts', name: 'format.ts' },
              { id: 'my-app/src/utils/validate.ts', name: 'validate.ts' },
            ],
          },
          { id: 'my-app/src/App.tsx', name: 'App.tsx' },
          { id: 'my-app/src/index.tsx', name: 'index.tsx' },
        ],
      },
      {
        id: 'my-app/tests', name: 'tests', children: [
          {
            id: 'my-app/tests/components', name: 'components', children: [
              { id: 'my-app/tests/components/Button.test.tsx', name: 'Button.test.tsx' },
            ],
          },
          {
            id: 'my-app/tests/utils', name: 'utils', children: [
              { id: 'my-app/tests/utils/format.test.ts', name: 'format.test.ts' },
            ],
          },
        ],
      },
      {
        id: 'my-app/public', name: 'public', children: [
          { id: 'my-app/public/favicon.ico', name: 'favicon.ico' },
          { id: 'my-app/public/index.html', name: 'index.html' },
        ],
      },
      { id: 'my-app/package.json', name: 'package.json' },
      { id: 'my-app/tsconfig.json', name: 'tsconfig.json' },
      { id: 'my-app/README.md', name: 'README.md' },
    ],
  },
]

function getAllFolderIds(nodes: TreeNode[]): string[] {
  const ids: string[] = []
  for (const n of nodes) {
    if (n.children && n.children.length > 0) {
      ids.push(n.id)
      ids.push(...getAllFolderIds(n.children))
    }
  }
  return ids
}

function countAllNodes(nodes: TreeNode[]): number {
  let count = 0
  for (const n of nodes) {
    count++
    if (n.children) count += countAllNodes(n.children)
  }
  return count
}

function getMatchingIds(nodes: TreeNode[], query: string): Set<string> {
  const matches = new Set<string>()
  const lowerQuery = query.toLowerCase()

  function walk(node: TreeNode, ancestors: string[]) {
    const nameMatches = node.name.toLowerCase().includes(lowerQuery)
    if (nameMatches) {
      matches.add(node.id)
      for (const a of ancestors) matches.add(a)
    }
    if (node.children) {
      for (const child of node.children) {
        walk(child, [...ancestors, node.id])
      }
    }
  }

  for (const node of nodes) walk(node, [])
  return matches
}

function findParentId(nodes: TreeNode[], targetId: string, parentId: string | null): string | null {
  for (const node of nodes) {
    if (node.id === targetId) return parentId
    if (node.children) {
      const found = findParentId(node.children, targetId, node.id)
      if (found !== null) return found
    }
  }
  return null
}

function flatten(
  nodes: TreeNode[],
  expandedIds: Set<string>,
  depth: number,
  parentLasts: boolean[],
  pathPrefix: string,
  filterIds: Set<string> | null
): FlatNode[] {
  const result: FlatNode[] = []
  const filteredNodes = filterIds
    ? nodes.filter(n => filterIds.has(n.id))
    : nodes

  filteredNodes.forEach((node, idx) => {
    const isLast = idx === filteredNodes.length - 1
    const hasChildren = !!(node.children && node.children.length > 0)
    const isExpanded = expandedIds.has(node.id)
    const path = pathPrefix ? `${pathPrefix}/${node.name}` : node.name

    result.push({
      id: node.id,
      name: node.name,
      depth,
      hasChildren,
      expanded: isExpanded,
      isLast,
      parentLasts: [...parentLasts],
      path,
    })

    if (hasChildren && isExpanded) {
      result.push(
        ...flatten(
          node.children!,
          expandedIds,
          depth + 1,
          [...parentLasts, isLast],
          path,
          filterIds
        )
      )
    }
  })
  return result
}

function getFileIcon(name: string): { icon: string; colorKey: 'info' | 'success' | 'warning' | 'secondary' | null } {
  if (name.endsWith('.tsx') || name.endsWith('.jsx')) return { icon: '\u{1F4C4}', colorKey: 'info' }
  if (name.endsWith('.ts') || name.endsWith('.js')) return { icon: '\u{1F4C4}', colorKey: 'success' }
  if (name.endsWith('.json')) return { icon: '\u{1F4C4}', colorKey: 'warning' }
  if (name.endsWith('.md')) return { icon: '\u{1F4C4}', colorKey: 'secondary' }
  return { icon: '\u{1F4C4}', colorKey: null }
}

const VIEWPORT_HEIGHT = 20

function TreeLine({ node, active, colors }: { node: FlatNode; active: boolean; colors: ReturnType<typeof useTheme> }) {
  const guides: React.ReactNode[] = []

  for (let i = 0; i < node.depth; i++) {
    const isParentLast = node.parentLasts[i]
    guides.push(
      <Text key={`g${i}`} dimColor>{isParentLast ? '   ' : '\u2502  '}</Text>
    )
  }

  let connector = ''
  if (node.depth > 0) {
    connector = node.isLast ? '\u2514\u2500\u2500' : '\u251C\u2500\u2500'
  }

  let expandIcon: React.ReactNode
  if (node.hasChildren) {
    const folderIcon = node.expanded ? '\u25BC \uD83D\uDCC2' : '\u25B6 \uD83D\uDCC1'
    expandIcon = <Text color={colors.info}>{folderIcon} </Text>
  } else {
    const { icon, colorKey } = getFileIcon(node.name)
    const fileColor = colorKey ? colors[colorKey] : undefined
    expandIcon = <Text color={fileColor}>  {icon} </Text>
  }

  return (
    <Box>
      {guides}
      {node.depth > 0 && <Text dimColor>{connector}</Text>}
      {expandIcon}
      <Text
        color={active ? colors.primary : undefined}
        bold={active}
        inverse={active}
      >
        {active ? ` ${node.name} ` : node.name}
      </Text>
    </Box>
  )
}

export function TreeView() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    expandedIds: ['my-app', 'my-app/src'],
    cursor: 0,
    searchQuery: '',
    searchMode: false,
  })

  const expandedSet = useMemo(() => new Set(state.expandedIds), [state.expandedIds])

  const filterIds = useMemo(() => {
    if (!state.searchMode || !state.searchQuery) return null
    return getMatchingIds(DEMO_TREE, state.searchQuery)
  }, [state.searchMode, state.searchQuery])

  const flat = useMemo(
    () => flatten(DEMO_TREE, expandedSet, 0, [], '', filterIds),
    [expandedSet, filterIds]
  )

  const totalNodes = useMemo(() => countAllNodes(DEMO_TREE), [])

  useInput((ch, key) => {
    if (state.searchMode) {
      if (key.escape) {
        dispatch({ type: 'exit_search' })
      } else if (key.backspace || key.delete) {
        dispatch({ type: 'search_backspace' })
      } else if (key.upArrow || (ch === 'k' && key.ctrl)) {
        dispatch({ type: 'move_up' })
      } else if (key.downArrow || (ch === 'j' && key.ctrl)) {
        dispatch({ type: 'move_down', max: flat.length })
      } else if (key.return) {
        const node = flat[state.cursor]
        if (node && node.hasChildren) {
          dispatch({ type: 'toggle', id: node.id })
        }
      } else if (ch && ch.length === 1 && !key.ctrl && !key.meta) {
        dispatch({ type: 'search_input', char: ch })
      }
      return
    }

    if (ch === 'j' || key.downArrow) {
      dispatch({ type: 'move_down', max: flat.length })
    } else if (ch === 'k' || key.upArrow) {
      dispatch({ type: 'move_up' })
    } else if (ch === 'l' || key.rightArrow || key.return) {
      const node = flat[state.cursor]
      if (node && node.hasChildren && !expandedSet.has(node.id)) {
        dispatch({ type: 'expand', id: node.id })
      }
    } else if (ch === 'h' || key.leftArrow) {
      const node = flat[state.cursor]
      if (node) {
        if (node.hasChildren && expandedSet.has(node.id)) {
          dispatch({ type: 'collapse', id: node.id })
        } else {
          const parentId = findParentId(DEMO_TREE, node.id, null)
          if (parentId) {
            const parentIdx = flat.findIndex(n => n.id === parentId)
            if (parentIdx >= 0) {
              dispatch({ type: 'set_cursor', cursor: parentIdx })
            }
          }
        }
      }
    } else if (ch === ' ') {
      const node = flat[state.cursor]
      if (node && node.hasChildren) {
        dispatch({ type: 'toggle', id: node.id })
      }
    } else if (ch === 'e') {
      dispatch({ type: 'expand_all', ids: getAllFolderIds(DEMO_TREE) })
    } else if (ch === 'c') {
      dispatch({ type: 'collapse_all' })
    } else if (ch === '/') {
      dispatch({ type: 'enter_search' })
    }
  })

  const scrollOffset = Math.max(0, Math.min(state.cursor - Math.floor(VIEWPORT_HEIGHT / 2), flat.length - VIEWPORT_HEIGHT))
  const visStart = Math.max(0, scrollOffset)
  const visEnd = Math.min(flat.length, visStart + VIEWPORT_HEIGHT)
  const visible = flat.slice(visStart, visEnd)

  const scrollPercent = flat.length <= VIEWPORT_HEIGHT ? 100 : Math.round((visEnd / flat.length) * 100)
  const currentNode = flat[state.cursor]
  const matchCount = filterIds ? filterIds.size : 0

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>File Explorer</Text>
        <Text dimColor>{flat.length} items</Text>
        <Text dimColor>(of {totalNodes} total)</Text>
      </Box>

      {/* Search bar */}
      {state.searchMode && (
        <Box marginBottom={1}>
          <Text color={colors.warning}>/</Text>
          <Text color={colors.warning}>{state.searchQuery}</Text>
          <Text color={colors.warning}>_</Text>
          {state.searchQuery && (
            <Text dimColor>  {matchCount} matches</Text>
          )}
        </Box>
      )}

      {/* Tree area */}
      <Box flexDirection="column">
        {visible.length === 0 ? (
          <Text dimColor>  No matching items</Text>
        ) : (
          visible.map((node, i) => (
            <TreeLine
              key={node.id}
              node={node}
              active={visStart + i === state.cursor}
              colors={colors}
            />
          ))
        )}
      </Box>

      {/* Scroll indicator */}
      {flat.length > VIEWPORT_HEIGHT && (
        <Box marginTop={1}>
          <Text dimColor>
            [{visStart + 1}-{visEnd} of {flat.length}] {scrollPercent}%
          </Text>
        </Box>
      )}

      {/* Footer: current path */}
      <Box marginTop={flat.length <= VIEWPORT_HEIGHT ? 1 : 0}>
        <Text dimColor>Path: </Text>
        <Text color={colors.info}>{currentNode ? currentNode.path : ''}</Text>
      </Box>

      {/* Keybindings help */}
      <Box marginTop={1} gap={1} flexWrap="wrap">
        <Box>
          <Text inverse bold> j/k </Text>
          <Text dimColor> nav</Text>
        </Box>
        <Box>
          <Text inverse bold> h/l </Text>
          <Text dimColor> collapse/expand</Text>
        </Box>
        <Box>
          <Text inverse bold> space </Text>
          <Text dimColor> toggle</Text>
        </Box>
        <Box>
          <Text inverse bold> e/c </Text>
          <Text dimColor> all</Text>
        </Box>
        <Box>
          <Text inverse bold> / </Text>
          <Text dimColor> search</Text>
        </Box>
      </Box>
    </Box>
  )
}
