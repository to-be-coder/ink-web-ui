import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'

interface Task {
  id: number
  text: string
  done: boolean
}

interface State {
  tasks: Task[]
  cursor: number
  input: string
  mode: 'navigate' | 'add'
}

type Action =
  | { type: 'move'; direction: -1 | 1 }
  | { type: 'toggle' }
  | { type: 'delete' }
  | { type: 'start_add' }
  | { type: 'confirm_add' }
  | { type: 'cancel_add' }
  | { type: 'type'; char: string }
  | { type: 'backspace' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'move': {
      const next = state.cursor + action.direction
      if (next < 0 || next >= state.tasks.length) return state
      return { ...state, cursor: next }
    }
    case 'toggle': {
      if (state.tasks.length === 0) return state
      return {
        ...state,
        tasks: state.tasks.map((t, i) =>
          i === state.cursor ? { ...t, done: !t.done } : t
        ),
      }
    }
    case 'delete': {
      if (state.tasks.length === 0) return state
      const tasks = state.tasks.filter((_, i) => i !== state.cursor)
      return {
        ...state,
        tasks,
        cursor: Math.min(state.cursor, Math.max(0, tasks.length - 1)),
      }
    }
    case 'start_add':
      return { ...state, mode: 'add', input: '' }
    case 'confirm_add': {
      const text = state.input.trim()
      if (!text) return { ...state, mode: 'navigate', input: '' }
      return {
        ...state,
        mode: 'navigate',
        input: '',
        tasks: [...state.tasks, { id: Date.now(), text, done: false }],
      }
    }
    case 'cancel_add':
      return { ...state, mode: 'navigate', input: '' }
    case 'type':
      return { ...state, input: state.input + action.char }
    case 'backspace':
      return { ...state, input: state.input.slice(0, -1) }
  }
}

const INITIAL_STATE: State = {
  tasks: [
    { id: 1, text: 'Try ink-web components', done: false },
    { id: 2, text: 'Build a terminal UI', done: false },
    { id: 3, text: 'Ship it to production', done: false },
  ],
  cursor: 0,
  input: '',
  mode: 'navigate',
}

const KEYBINDINGS = [
  { key: '↑↓', label: 'move' },
  { key: 'space', label: 'toggle' },
  { key: 'a', label: 'add' },
  { key: 'd', label: 'delete' },
]

export function TaskList() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const { tasks, cursor, input, mode } = state

  useInput((ch, key) => {
    if (mode === 'add') {
      if (key.return) dispatch({ type: 'confirm_add' })
      else if (key.escape) dispatch({ type: 'cancel_add' })
      else if (key.backspace || key.delete) dispatch({ type: 'backspace' })
      else if (ch && !key.ctrl && !key.meta) dispatch({ type: 'type', char: ch })
      return
    }

    if (key.upArrow || ch === 'k') dispatch({ type: 'move', direction: -1 })
    else if (key.downArrow || ch === 'j') dispatch({ type: 'move', direction: 1 })
    else if (ch === ' ' || key.return) dispatch({ type: 'toggle' })
    else if (ch === 'a') dispatch({ type: 'start_add' })
    else if (ch === 'd') dispatch({ type: 'delete' })
  })

  const done = tasks.filter(t => t.done).length

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan"> Tasks </Text>
        <Text dimColor> {done}/{tasks.length} done</Text>
      </Box>

      {tasks.length === 0 ? (
        <Text dimColor italic>  No tasks. Press 'a' to add one.</Text>
      ) : (
        tasks.map((task, i) => {
          const active = i === cursor && mode === 'navigate'
          return (
            <Box key={task.id}>
              <Text color={active ? 'cyan' : undefined}>
                {active ? '❯' : ' '}{' '}
              </Text>
              <Text color={task.done ? 'green' : 'gray'}>
                {task.done ? '✔' : '○'}{' '}
              </Text>
              <Text strikethrough={task.done} dimColor={task.done}>
                {task.text}
              </Text>
            </Box>
          )
        })
      )}

      {mode === 'add' && (
        <Box marginTop={1}>
          <Text color="yellow">+ </Text>
          <Text>{input}</Text>
          <Text color="gray">▌</Text>
        </Box>
      )}

      <Box marginTop={1} gap={2}>
        {KEYBINDINGS.map(({ key, label }) => (
          <Box key={key}>
            <Text inverse bold> {key} </Text>
            <Text dimColor> {label}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
