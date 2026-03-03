import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'completed'
  language: string
  lastUpdated: string
}

const INITIAL_PROJECTS: Project[] = [
  { id: '1', name: 'ink-web', description: 'React for terminals rendered in xterm.js in the browser', status: 'active', language: 'TypeScript', lastUpdated: '2025-01-15' },
  { id: '2', name: 'flux-capacitor', description: 'Time-series database with temporal queries', status: 'active', language: 'Rust', lastUpdated: '2025-01-12' },
  { id: '3', name: 'pixel-forge', description: 'GPU-accelerated image processing pipeline', status: 'paused', language: 'C++', lastUpdated: '2024-12-28' },
  { id: '4', name: 'quantum-css', description: 'Next-gen CSS-in-JS with zero runtime overhead', status: 'completed', language: 'TypeScript', lastUpdated: '2024-11-30' },
  { id: '5', name: 'echo-stream', description: 'Real-time audio processing and streaming toolkit', status: 'active', language: 'Go', lastUpdated: '2025-01-10' },
  { id: '6', name: 'terra-map', description: 'Geospatial data visualization framework', status: 'paused', language: 'Python', lastUpdated: '2024-12-15' },
  { id: '7', name: 'bolt-queue', description: 'High-throughput distributed message queue', status: 'active', language: 'Rust', lastUpdated: '2025-01-14' },
  { id: '8', name: 'neural-sketch', description: 'AI-powered wireframe to code converter', status: 'completed', language: 'Python', lastUpdated: '2024-10-22' },
]

type ModalType = 'detail' | 'confirm'

interface ModalEntry {
  type: ModalType
  projectId: string
}

interface State {
  projects: Project[]
  cursor: number
  modalStack: ModalEntry[]
  confirmChoice: 'yes' | 'no'
}

type Action =
  | { type: 'move_up' }
  | { type: 'move_down' }
  | { type: 'open_detail' }
  | { type: 'open_confirm' }
  | { type: 'open_confirm_from_detail' }
  | { type: 'close_modal' }
  | { type: 'toggle_confirm_choice' }
  | { type: 'confirm_delete' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'move_up':
      if (state.projects.length === 0) return state
      return { ...state, cursor: Math.max(0, state.cursor - 1) }
    case 'move_down':
      if (state.projects.length === 0) return state
      return { ...state, cursor: Math.min(state.projects.length - 1, state.cursor + 1) }
    case 'open_detail': {
      if (state.projects.length === 0) return state
      const project = state.projects[state.cursor]
      if (!project) return state
      return {
        ...state,
        modalStack: [...state.modalStack, { type: 'detail', projectId: project.id }],
      }
    }
    case 'open_confirm': {
      if (state.projects.length === 0) return state
      const project = state.projects[state.cursor]
      if (!project) return state
      return {
        ...state,
        modalStack: [...state.modalStack, { type: 'confirm', projectId: project.id }],
        confirmChoice: 'no',
      }
    }
    case 'open_confirm_from_detail': {
      const topModal = state.modalStack[state.modalStack.length - 1]
      if (!topModal) return state
      return {
        ...state,
        modalStack: [...state.modalStack, { type: 'confirm', projectId: topModal.projectId }],
        confirmChoice: 'no',
      }
    }
    case 'close_modal':
      return {
        ...state,
        modalStack: state.modalStack.slice(0, -1),
      }
    case 'toggle_confirm_choice':
      return {
        ...state,
        confirmChoice: state.confirmChoice === 'yes' ? 'no' : 'yes',
      }
    case 'confirm_delete': {
      const topModal = state.modalStack[state.modalStack.length - 1]
      if (!topModal) return state
      const newProjects = state.projects.filter(p => p.id !== topModal.projectId)
      // Close all modals that reference this project
      const newStack = state.modalStack.filter(m => m.projectId !== topModal.projectId)
      const newCursor = Math.min(state.cursor, Math.max(0, newProjects.length - 1))
      return {
        ...state,
        projects: newProjects,
        modalStack: newStack,
        cursor: newCursor,
      }
    }
  }
}

function StatusBadge({ status, colors }: { status: Project['status']; colors: ReturnType<typeof useTheme> }) {
  const colorMap = {
    active: colors.success,
    paused: colors.warning,
    completed: colors.info,
  }
  const labelMap = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Done',
  }
  return <Text color={colorMap[status]} bold>{labelMap[status]}</Text>
}

export function Modal() {
  const colors = useTheme()

  const [state, dispatch] = useReducer(reducer, {
    projects: INITIAL_PROJECTS,
    cursor: 0,
    modalStack: [],
    confirmChoice: 'no',
  })

  const { projects, cursor, modalStack, confirmChoice } = state
  const topModal = modalStack.length > 0 ? modalStack[modalStack.length - 1] : null
  const isListActive = modalStack.length === 0
  const isDetailActive = topModal?.type === 'detail'
  const isConfirmActive = topModal?.type === 'confirm'

  // List view input
  useInput((ch, key) => {
    if (ch === 'j' || key.downArrow) dispatch({ type: 'move_down' })
    else if (ch === 'k' || key.upArrow) dispatch({ type: 'move_up' })
    else if (key.return) dispatch({ type: 'open_detail' })
    else if (ch === 'd') dispatch({ type: 'open_confirm' })
  }, { isActive: isListActive })

  // Detail modal input
  useInput((ch, key) => {
    if (key.escape) dispatch({ type: 'close_modal' })
    else if (ch === 'd') dispatch({ type: 'open_confirm_from_detail' })
  }, { isActive: isDetailActive })

  // Confirm modal input
  useInput((ch, key) => {
    if (key.escape || ch === 'n') dispatch({ type: 'close_modal' })
    else if (ch === 'y') dispatch({ type: 'confirm_delete' })
    else if (key.leftArrow || key.rightArrow || key.tab) dispatch({ type: 'toggle_confirm_choice' })
    else if (key.return) {
      if (confirmChoice === 'yes') dispatch({ type: 'confirm_delete' })
      else dispatch({ type: 'close_modal' })
    }
  }, { isActive: isConfirmActive })

  // Get project by id
  const getProject = (id: string) => projects.find(p => p.id === id)

  // Render confirm modal
  if (isConfirmActive && topModal) {
    const project = getProject(topModal.projectId)
    const name = project?.name ?? 'Unknown'

    return (
      <Box flexDirection="column" justifyContent="center" alignItems="center" paddingX={1} flexGrow={1}>
        <Box flexDirection="column" borderStyle="double" borderColor={colors.error} paddingX={2} paddingY={1} width={44}>
          {/* Title bar */}
          <Box justifyContent="space-between" marginBottom={1}>
            <Text bold color={colors.error}>Delete Project</Text>
            <Text dimColor>[Esc]</Text>
          </Box>

          {/* Body */}
          <Box flexDirection="column" marginBottom={1}>
            <Text>Are you sure you want to delete</Text>
            <Text bold color="white">{name}</Text>
            <Text dimColor>This action cannot be undone.</Text>
          </Box>

          {/* Buttons */}
          <Box gap={2} justifyContent="center">
            <Text
              backgroundColor={confirmChoice === 'yes' ? colors.error : undefined}
              color={confirmChoice === 'yes' ? 'white' : 'gray'}
              bold={confirmChoice === 'yes'}
            >
              {' [y] Yes '}
            </Text>
            <Text
              backgroundColor={confirmChoice === 'no' ? 'white' : undefined}
              color={confirmChoice === 'no' ? 'black' : 'gray'}
              bold={confirmChoice === 'no'}
            >
              {' [n] No  '}
            </Text>
          </Box>
        </Box>
      </Box>
    )
  }

  // Render detail modal
  if (isDetailActive && topModal) {
    const project = getProject(topModal.projectId)
    if (!project) {
      return (
        <Box paddingX={1}>
          <Text color={colors.error}>Project not found</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column" justifyContent="center" alignItems="center" paddingX={1} flexGrow={1}>
        <Box flexDirection="column" borderStyle="double" borderColor={colors.primary} paddingX={2} paddingY={1} width={52}>
          {/* Title bar */}
          <Box justifyContent="space-between" marginBottom={1}>
            <Text bold color={colors.primary}>{project.name}</Text>
            <Text dimColor>[Esc]</Text>
          </Box>

          {/* Details */}
          <Box flexDirection="column" gap={0}>
            <Box>
              <Text dimColor>{'Description  '}</Text>
              <Text>{project.description}</Text>
            </Box>
            <Box>
              <Text dimColor>{'Status       '}</Text>
              <StatusBadge status={project.status} colors={colors} />
            </Box>
            <Box>
              <Text dimColor>{'Language     '}</Text>
              <Text color={colors.info}>{project.language}</Text>
            </Box>
            <Box>
              <Text dimColor>{'Updated      '}</Text>
              <Text>{project.lastUpdated}</Text>
            </Box>
          </Box>

          {/* Footer hints */}
          <Box marginTop={1} gap={2}>
            <Box>
              <Text inverse bold> d </Text>
              <Text dimColor> delete</Text>
            </Box>
            <Box>
              <Text inverse bold> esc </Text>
              <Text dimColor> close</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  // Render main list view
  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Modal</Text>
        <Text color="white">Projects</Text>
        <Text dimColor>{projects.length} items</Text>
      </Box>

      {/* Project list */}
      <Box flexDirection="column">
        {projects.map((project, i) => {
          const isActive = i === cursor
          return (
            <Box key={project.id} gap={1}>
              <Text color={isActive ? colors.primary : 'gray'}>
                {isActive ? '>' : ' '}
              </Text>
              <Text
                color={isActive ? 'white' : undefined}
                bold={isActive}
              >
                {project.name.padEnd(18)}
              </Text>
              <StatusBadge status={project.status} colors={colors} />
              <Text dimColor>  {project.language}</Text>
            </Box>
          )
        })}
      </Box>

      {projects.length === 0 && (
        <Box marginY={1}>
          <Text dimColor>No projects. All have been deleted.</Text>
        </Box>
      )}

      {/* Footer hints */}
      <Box marginTop={1} gap={2}>
        <Box>
          <Text inverse bold> enter </Text>
          <Text dimColor> view</Text>
        </Box>
        <Box>
          <Text inverse bold> d </Text>
          <Text dimColor> delete</Text>
        </Box>
        <Box>
          <Text inverse bold> j/k </Text>
          <Text dimColor> navigate</Text>
        </Box>
      </Box>
    </Box>
  )
}
