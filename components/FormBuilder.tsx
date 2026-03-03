import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// ── Field types ──────────────────────────────────────────────────────

type FieldType = 'select' | 'input' | 'multiselect' | 'confirm' | 'note'

interface SelectOption {
  label: string
  value: string
}

interface BaseField {
  id: string
  label: string
  description?: string
}

interface SelectField extends BaseField {
  type: 'select'
  options: SelectOption[]
}

interface InputField extends BaseField {
  type: 'input'
  placeholder?: string
  validate?: (value: string) => string | null
}

interface MultiSelectField extends BaseField {
  type: 'multiselect'
  options: SelectOption[]
  maxSelections?: number
}

interface ConfirmField extends BaseField {
  type: 'confirm'
}

interface NoteField extends BaseField {
  type: 'note'
  render: (values: Record<string, unknown>) => string[]
}

type Field = SelectField | InputField | MultiSelectField | ConfirmField | NoteField

interface Group {
  title: string
  fields: Field[]
}

// ── State ────────────────────────────────────────────────────────────

interface FieldState {
  selectIndex: number
  inputValue: string
  multiSelected: Set<string>
  multiCursor: number
  confirmValue: boolean
  error: string | null
}

interface State {
  groupIndex: number
  fieldIndex: number
  fieldStates: Record<string, FieldState>
  submitted: boolean
}

type Action =
  | { type: 'next_field' }
  | { type: 'prev_field' }
  | { type: 'next_group' }
  | { type: 'prev_group' }
  | { type: 'select_up'; fieldId: string; max: number }
  | { type: 'select_down'; fieldId: string; max: number }
  | { type: 'multi_toggle'; fieldId: string; value: string; maxSelections?: number }
  | { type: 'multi_up'; fieldId: string; max: number }
  | { type: 'multi_down'; fieldId: string; max: number }
  | { type: 'input_char'; fieldId: string; char: string }
  | { type: 'input_backspace'; fieldId: string }
  | { type: 'set_error'; fieldId: string; error: string | null }
  | { type: 'confirm_toggle'; fieldId: string }
  | { type: 'confirm_set'; fieldId: string; value: boolean }
  | { type: 'submit' }

function getFieldState(state: State, fieldId: string): FieldState {
  return state.fieldStates[fieldId] ?? {
    selectIndex: 0,
    inputValue: '',
    multiSelected: new Set<string>(),
    multiCursor: 0,
    confirmValue: false,
    error: null,
  }
}

function updateFieldState(state: State, fieldId: string, patch: Partial<FieldState>): State {
  const prev = getFieldState(state, fieldId)
  return {
    ...state,
    fieldStates: {
      ...state.fieldStates,
      [fieldId]: { ...prev, ...patch },
    },
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next_field':
      return { ...state, fieldIndex: state.fieldIndex + 1 }
    case 'prev_field':
      return { ...state, fieldIndex: state.fieldIndex - 1 }
    case 'next_group':
      return { ...state, groupIndex: state.groupIndex + 1, fieldIndex: 0 }
    case 'prev_group':
      return { ...state, groupIndex: state.groupIndex - 1, fieldIndex: 0 }
    case 'select_up': {
      const fs = getFieldState(state, action.fieldId)
      return updateFieldState(state, action.fieldId, {
        selectIndex: Math.max(0, fs.selectIndex - 1),
      })
    }
    case 'select_down': {
      const fs = getFieldState(state, action.fieldId)
      return updateFieldState(state, action.fieldId, {
        selectIndex: Math.min(action.max - 1, fs.selectIndex + 1),
      })
    }
    case 'multi_up': {
      const fs = getFieldState(state, action.fieldId)
      return updateFieldState(state, action.fieldId, {
        multiCursor: Math.max(0, fs.multiCursor - 1),
      })
    }
    case 'multi_down': {
      const fs = getFieldState(state, action.fieldId)
      return updateFieldState(state, action.fieldId, {
        multiCursor: Math.min(action.max - 1, fs.multiCursor + 1),
      })
    }
    case 'multi_toggle': {
      const fs = getFieldState(state, action.fieldId)
      const next = new Set(fs.multiSelected)
      if (next.has(action.value)) {
        next.delete(action.value)
      } else {
        if (action.maxSelections && next.size >= action.maxSelections) return state
        next.add(action.value)
      }
      return updateFieldState(state, action.fieldId, { multiSelected: next })
    }
    case 'input_char': {
      const fs = getFieldState(state, action.fieldId)
      return updateFieldState(state, action.fieldId, {
        inputValue: fs.inputValue + action.char,
        error: null,
      })
    }
    case 'input_backspace': {
      const fs = getFieldState(state, action.fieldId)
      return updateFieldState(state, action.fieldId, {
        inputValue: fs.inputValue.slice(0, -1),
        error: null,
      })
    }
    case 'set_error':
      return updateFieldState(state, action.fieldId, { error: action.error })
    case 'confirm_toggle': {
      const fs = getFieldState(state, action.fieldId)
      return updateFieldState(state, action.fieldId, { confirmValue: !fs.confirmValue })
    }
    case 'confirm_set':
      return updateFieldState(state, action.fieldId, { confirmValue: action.value })
    case 'submit':
      return { ...state, submitted: true }
  }
}

// ── Demo data ────────────────────────────────────────────────────────

const GROUPS: Group[] = [
  {
    title: 'Service',
    fields: [
      {
        id: 'environment',
        type: 'select',
        label: 'Environment',
        description: 'Target deployment environment',
        options: [
          { label: 'Development', value: 'development' },
          { label: 'Staging', value: 'staging' },
          { label: 'Production', value: 'production' },
        ],
      },
      {
        id: 'service_name',
        type: 'input',
        label: 'Service Name',
        description: 'Unique name for this service (required, no spaces)',
        placeholder: 'my-service',
        validate: (value: string) => {
          if (!value.trim()) return 'Service name is required'
          if (/\s/.test(value)) return 'Service name cannot contain spaces'
          return null
        },
      },
    ],
  },
  {
    title: 'Options',
    fields: [
      {
        id: 'features',
        type: 'multiselect',
        label: 'Features',
        description: 'Enable features for this deployment (max 3)',
        maxSelections: 3,
        options: [
          { label: 'Logging', value: 'logging' },
          { label: 'Monitoring', value: 'monitoring' },
          { label: 'Auto-scaling', value: 'autoscaling' },
          { label: 'CDN', value: 'cdn' },
          { label: 'Rate Limiting', value: 'ratelimiting' },
        ],
      },
      {
        id: 'replicas',
        type: 'input',
        label: 'Replicas',
        description: 'Number of replicas (1-10)',
        placeholder: '3',
        validate: (value: string) => {
          if (!value.trim()) return 'Replicas is required'
          const n = parseInt(value, 10)
          if (isNaN(n) || n < 1 || n > 10) return 'Must be a number between 1 and 10'
          return null
        },
      },
    ],
  },
  {
    title: 'Confirm',
    fields: [
      {
        id: 'summary',
        type: 'note',
        label: 'Deploy Summary',
        description: 'Review your selections',
        render: (values: Record<string, unknown>) => {
          const lines: string[] = []
          const env = values['environment'] as string | undefined
          lines.push(`  Environment:  ${env ?? 'not set'}`)
          const name = values['service_name'] as string | undefined
          lines.push(`  Service Name: ${name || 'not set'}`)
          const features = values['features'] as Set<string> | undefined
          lines.push(`  Features:     ${features && features.size > 0 ? [...features].join(', ') : 'none'}`)
          const replicas = values['replicas'] as string | undefined
          lines.push(`  Replicas:     ${replicas || 'not set'}`)
          return lines
        },
      },
      {
        id: 'deploy_confirm',
        type: 'confirm',
        label: 'Deploy now?',
        description: 'This will start the deployment',
      },
    ],
  },
]

// ── Helper: collect all values ───────────────────────────────────────

function collectValues(fieldStates: Record<string, FieldState>): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const group of GROUPS) {
    for (const field of group.fields) {
      const fs = fieldStates[field.id]
      if (!fs) continue
      switch (field.type) {
        case 'select':
          values[field.id] = field.options[fs.selectIndex]?.label ?? ''
          break
        case 'input':
          values[field.id] = fs.inputValue
          break
        case 'multiselect':
          values[field.id] = fs.multiSelected
          break
        case 'confirm':
          values[field.id] = fs.confirmValue
          break
      }
    }
  }
  return values
}

// ── Sub-components ───────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const colors = useTheme()
  const dots = Array.from({ length: total }, (_, i) => i)
  return (
    <Box gap={1}>
      <Text dimColor>Step {current + 1}/{total}</Text>
      <Box>
        {dots.map(i => (
          <Text key={i} color={i === current ? colors.primary : i < current ? colors.success : 'gray'}>
            {i === current ? '●' : i < current ? '●' : '○'}
          </Text>
        ))}
      </Box>
    </Box>
  )
}

function SelectFieldView({ field, fs, active }: { field: SelectField; fs: FieldState; active: boolean }) {
  const colors = useTheme()
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={active ? colors.primary : 'gray'}>{active ? '❯' : ' '}</Text>
        <Text bold={active}>{field.label}</Text>
        {field.description && <Text dimColor>{field.description}</Text>}
      </Box>
      {active ? (
        <Box flexDirection="column" marginLeft={3}>
          {field.options.map((opt, i) => {
            const isSelected = i === fs.selectIndex
            return (
              <Box key={opt.value} gap={1}>
                <Text color={isSelected ? colors.primary : 'gray'}>{isSelected ? '❯' : ' '}</Text>
                <Text color={isSelected ? colors.primary : 'gray'}>{isSelected ? '◉' : '◯'}</Text>
                <Text color={isSelected ? colors.primary : undefined} bold={isSelected}>{opt.label}</Text>
              </Box>
            )
          })}
        </Box>
      ) : (
        <Box marginLeft={3} gap={1}>
          <Text dimColor>Selected:</Text>
          <Text>{field.options[fs.selectIndex]?.label ?? 'none'}</Text>
        </Box>
      )}
    </Box>
  )
}

function InputFieldView({ field, fs, active }: { field: InputField; fs: FieldState; active: boolean }) {
  const colors = useTheme()
  const displayValue = fs.inputValue || (active ? '' : field.placeholder ?? '')
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={active ? colors.primary : 'gray'}>{active ? '❯' : ' '}</Text>
        <Text bold={active}>{field.label}</Text>
        {field.description && <Text dimColor>{field.description}</Text>}
      </Box>
      <Box marginLeft={3} gap={1}>
        <Text color={active ? colors.primary : 'gray'}>{'>'}</Text>
        <Text color={!fs.inputValue && !active ? 'gray' : undefined}>
          {displayValue}
        </Text>
        {active && <Text color="gray">_</Text>}
      </Box>
      {fs.error && (
        <Box marginLeft={3}>
          <Text color={colors.error}>{fs.error}</Text>
        </Box>
      )}
    </Box>
  )
}

function MultiSelectFieldView({ field, fs, active }: { field: MultiSelectField; fs: FieldState; active: boolean }) {
  const colors = useTheme()
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={active ? colors.primary : 'gray'}>{active ? '❯' : ' '}</Text>
        <Text bold={active}>{field.label}</Text>
        {field.description && <Text dimColor>{field.description}</Text>}
      </Box>
      {active ? (
        <Box flexDirection="column" marginLeft={3}>
          {field.options.map((opt, i) => {
            const isCursor = i === fs.multiCursor
            const isChecked = fs.multiSelected.has(opt.value)
            return (
              <Box key={opt.value} gap={1}>
                <Text color={isCursor ? colors.primary : 'gray'}>{isCursor ? '❯' : ' '}</Text>
                <Text color={isChecked ? colors.success : 'gray'}>{isChecked ? '◉' : '◯'}</Text>
                <Text color={isCursor ? colors.primary : isChecked ? colors.success : undefined} bold={isCursor}>
                  {opt.label}
                </Text>
              </Box>
            )
          })}
          {field.maxSelections && (
            <Text dimColor>  {fs.multiSelected.size}/{field.maxSelections} selected</Text>
          )}
        </Box>
      ) : (
        <Box marginLeft={3} gap={1}>
          <Text dimColor>Selected:</Text>
          <Text>{fs.multiSelected.size > 0 ? [...fs.multiSelected].join(', ') : 'none'}</Text>
        </Box>
      )}
    </Box>
  )
}

function ConfirmFieldView({ field, fs, active }: { field: ConfirmField; fs: FieldState; active: boolean }) {
  const colors = useTheme()
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={active ? colors.primary : 'gray'}>{active ? '❯' : ' '}</Text>
        <Text bold={active}>{field.label}</Text>
        {field.description && <Text dimColor>{field.description}</Text>}
      </Box>
      <Box marginLeft={3} gap={2}>
        <Text
          color={fs.confirmValue ? colors.success : 'gray'}
          bold={fs.confirmValue}
          inverse={active && fs.confirmValue}
        >
          {' Yes '}
        </Text>
        <Text
          color={!fs.confirmValue ? colors.error : 'gray'}
          bold={!fs.confirmValue}
          inverse={active && !fs.confirmValue}
        >
          {' No '}
        </Text>
      </Box>
    </Box>
  )
}

function NoteFieldView({ field, values, active }: { field: NoteField; values: Record<string, unknown>; active: boolean }) {
  const colors = useTheme()
  const lines = field.render(values)
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={active ? colors.primary : 'gray'}>{active ? '❯' : ' '}</Text>
        <Text bold={active}>{field.label}</Text>
        {field.description && <Text dimColor>{field.description}</Text>}
      </Box>
      <Box flexDirection="column" marginLeft={3} marginY={0}>
        <Text dimColor>{'┌' + '─'.repeat(36) + '┐'}</Text>
        {lines.map((line, i) => (
          <Text key={i} dimColor>{'│'} <Text color={colors.info}>{line.padEnd(34)}</Text>{'│'}</Text>
        ))}
        <Text dimColor>{'└' + '─'.repeat(36) + '┘'}</Text>
      </Box>
    </Box>
  )
}

// ── Main component ───────────────────────────────────────────────────

export function FormBuilder() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, {
    groupIndex: 0,
    fieldIndex: 0,
    fieldStates: {},
    submitted: false,
  })

  const { groupIndex, fieldIndex, submitted, fieldStates } = state
  const currentGroup = GROUPS[groupIndex]!
  const currentField = currentGroup.fields[fieldIndex]
  const values = collectValues(fieldStates)

  useInput((ch, key) => {
    if (submitted) return

    const field = currentField
    if (!field) return
    const fs = getFieldState(state, field.id)

    // ── Navigation between fields ──
    if (key.tab && !key.shift) {
      // Tab goes to next field
      if (fieldIndex < currentGroup.fields.length - 1) {
        dispatch({ type: 'next_field' })
      } else if (groupIndex < GROUPS.length - 1) {
        dispatch({ type: 'next_group' })
      }
      return
    }
    if (key.tab && key.shift) {
      // Shift+Tab goes to previous field
      if (fieldIndex > 0) {
        dispatch({ type: 'prev_field' })
      } else if (groupIndex > 0) {
        dispatch({ type: 'prev_group' })
      }
      return
    }

    // ── Field-specific input ──
    switch (field.type) {
      case 'select': {
        const sf = field as SelectField
        if (key.upArrow || ch === 'k') {
          dispatch({ type: 'select_up', fieldId: field.id, max: sf.options.length })
        } else if (key.downArrow || ch === 'j') {
          dispatch({ type: 'select_down', fieldId: field.id, max: sf.options.length })
        } else if (key.return) {
          // Advance to next field or group
          if (fieldIndex < currentGroup.fields.length - 1) {
            dispatch({ type: 'next_field' })
          } else if (groupIndex < GROUPS.length - 1) {
            dispatch({ type: 'next_group' })
          }
        }
        break
      }
      case 'input': {
        const inf = field as InputField
        if (key.return) {
          // Validate on submit
          if (inf.validate) {
            const error = inf.validate(fs.inputValue)
            if (error) {
              dispatch({ type: 'set_error', fieldId: field.id, error })
              return
            }
          }
          dispatch({ type: 'set_error', fieldId: field.id, error: null })
          if (fieldIndex < currentGroup.fields.length - 1) {
            dispatch({ type: 'next_field' })
          } else if (groupIndex < GROUPS.length - 1) {
            dispatch({ type: 'next_group' })
          }
        } else if (key.backspace || key.delete) {
          if (fs.inputValue.length === 0 && fieldIndex === 0 && groupIndex > 0) {
            dispatch({ type: 'prev_group' })
          } else {
            dispatch({ type: 'input_backspace', fieldId: field.id })
          }
        } else if (ch && !key.ctrl && !key.meta && !key.escape) {
          dispatch({ type: 'input_char', fieldId: field.id, char: ch })
        }
        break
      }
      case 'multiselect': {
        const mf = field as MultiSelectField
        if (key.upArrow || ch === 'k') {
          dispatch({ type: 'multi_up', fieldId: field.id, max: mf.options.length })
        } else if (key.downArrow || ch === 'j') {
          dispatch({ type: 'multi_down', fieldId: field.id, max: mf.options.length })
        } else if (ch === ' ') {
          const opt = mf.options[fs.multiCursor]
          if (opt) {
            dispatch({ type: 'multi_toggle', fieldId: field.id, value: opt.value, maxSelections: mf.maxSelections })
          }
        } else if (key.return) {
          if (fieldIndex < currentGroup.fields.length - 1) {
            dispatch({ type: 'next_field' })
          } else if (groupIndex < GROUPS.length - 1) {
            dispatch({ type: 'next_group' })
          }
        }
        break
      }
      case 'confirm': {
        if (ch === 'y') {
          dispatch({ type: 'confirm_set', fieldId: field.id, value: true })
        } else if (ch === 'n') {
          dispatch({ type: 'confirm_set', fieldId: field.id, value: false })
        } else if (key.leftArrow || key.rightArrow) {
          dispatch({ type: 'confirm_toggle', fieldId: field.id })
        } else if (key.return) {
          if (groupIndex === GROUPS.length - 1 && fieldIndex === currentGroup.fields.length - 1) {
            dispatch({ type: 'submit' })
          } else if (fieldIndex < currentGroup.fields.length - 1) {
            dispatch({ type: 'next_field' })
          } else if (groupIndex < GROUPS.length - 1) {
            dispatch({ type: 'next_group' })
          }
        }
        break
      }
      case 'note': {
        if (key.return) {
          if (fieldIndex < currentGroup.fields.length - 1) {
            dispatch({ type: 'next_field' })
          } else if (groupIndex < GROUPS.length - 1) {
            dispatch({ type: 'next_group' })
          }
        } else if (ch === 'j') {
          if (fieldIndex < currentGroup.fields.length - 1) {
            dispatch({ type: 'next_field' })
          }
        } else if (ch === 'k') {
          if (fieldIndex > 0) {
            dispatch({ type: 'prev_field' })
          } else if (groupIndex > 0) {
            dispatch({ type: 'prev_group' })
          }
        }
        break
      }
    }
  })

  // ── Submitted view ─────────────────────────────────────────────────

  if (submitted) {
    const finalValues = collectValues(fieldStates)
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box marginBottom={1} gap={1}>
          <Text color={colors.success}>✔</Text>
          <Text bold color={colors.success}>Submitted</Text>
          <Text dimColor>Deploy Configuration</Text>
        </Box>

        <Box flexDirection="column" marginLeft={2}>
          <Text dimColor>{'─'.repeat(40)}</Text>
          {GROUPS.map(group => (
            <Box key={group.title} flexDirection="column" marginBottom={1}>
              <Text bold color={colors.secondary}>{group.title}</Text>
              {group.fields.map(field => {
                if (field.type === 'note') return null
                const fs = getFieldState(state, field.id)
                let displayValue = ''
                switch (field.type) {
                  case 'select':
                    displayValue = (field as SelectField).options[fs.selectIndex]?.label ?? ''
                    break
                  case 'input':
                    displayValue = fs.inputValue || '(empty)'
                    break
                  case 'multiselect':
                    displayValue = fs.multiSelected.size > 0
                      ? [...fs.multiSelected].join(', ')
                      : '(none)'
                    break
                  case 'confirm':
                    displayValue = fs.confirmValue ? 'Yes' : 'No'
                    break
                }
                return (
                  <Box key={field.id} gap={1} marginLeft={1}>
                    <Text dimColor>{field.label}:</Text>
                    <Text color={colors.info}>{displayValue}</Text>
                  </Box>
                )
              })}
            </Box>
          ))}
          <Text dimColor>{'─'.repeat(40)}</Text>
        </Box>
      </Box>
    )
  }

  // ── Active form view ───────────────────────────────────────────────

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color={colors.primary}>Deploy Configuration</Text>
        <ProgressBar current={groupIndex} total={GROUPS.length} />
      </Box>

      {/* Group title */}
      <Box marginBottom={1}>
        <Text bold color={colors.secondary}>{currentGroup.title}</Text>
      </Box>

      {/* Fields */}
      <Box flexDirection="column" gap={1}>
        {currentGroup.fields.map((field, i) => {
          const active = i === fieldIndex
          const fs = getFieldState(state, field.id)

          switch (field.type) {
            case 'select':
              return <SelectFieldView key={field.id} field={field as SelectField} fs={fs} active={active} />
            case 'input':
              return <InputFieldView key={field.id} field={field as InputField} fs={fs} active={active} />
            case 'multiselect':
              return <MultiSelectFieldView key={field.id} field={field as MultiSelectField} fs={fs} active={active} />
            case 'confirm':
              return <ConfirmFieldView key={field.id} field={field as ConfirmField} fs={fs} active={active} />
            case 'note':
              return <NoteFieldView key={field.id} field={field as NoteField} values={values} active={active} />
          }
        })}
      </Box>

      {/* Help bar */}
      <Box marginTop={1} gap={1}>
        <Text dimColor>
          <Text bold>tab</Text>/<Text bold>shift+tab</Text> navigate
          {'  '}
          {currentField?.type === 'select' && <><Text bold>up</Text>/<Text bold>down</Text> select  </>}
          {currentField?.type === 'multiselect' && <><Text bold>space</Text> toggle  <Text bold>up</Text>/<Text bold>down</Text> move  </>}
          {currentField?.type === 'input' && <><Text bold>type</Text> to enter  </>}
          {currentField?.type === 'confirm' && <><Text bold>y</Text>/<Text bold>n</Text> or <Text bold>left</Text>/<Text bold>right</Text>  </>}
          <Text bold>enter</Text> next
        </Text>
      </Box>
    </Box>
  )
}
