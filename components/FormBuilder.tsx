import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

// ── Field types ──────────────────────────────────────────────────────

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
        description: 'Unique name for this service (no spaces)',
        placeholder: 'my-service',
        validate: (value: string) => {
          if (!value.trim()) return 'Service name is required'
          if (/\s/.test(value)) return 'Cannot contain spaces'
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
          if (isNaN(n) || n < 1 || n > 10) return 'Must be between 1 and 10'
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
          const env = values['environment'] as string | undefined
          const name = values['service_name'] as string | undefined
          const features = values['features'] as Set<string> | undefined
          const replicas = values['replicas'] as string | undefined
          return [
            `Environment:  ${env ?? 'not set'}`,
            `Service Name: ${name || 'not set'}`,
            `Features:     ${features && features.size > 0 ? [...features].join(', ') : 'none'}`,
            `Replicas:     ${replicas || 'not set'}`,
          ]
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

// ── Guide bar primitives (clack-inspired) ────────────────────────────

type BarSymbol = 'active' | 'done' | 'pending' | 'error' | 'bar'

function GBar({ kind, color }: { kind: BarSymbol; color?: string }) {
  const colors = useTheme()
  const symbols: Record<BarSymbol, string> = {
    active: '\u25C6',  // ◆
    done: '\u25C7',    // ◇
    pending: '\u25CB',  // ○
    error: '\u25B2',   // ▲
    bar: '\u2502',     // │
  }
  const symColors: Record<BarSymbol, string> = {
    active: colors.primary,
    done: colors.success,
    pending: 'gray',
    error: colors.warning,
    bar: 'gray',
  }
  return <Text color={color ?? symColors[kind]}>{symbols[kind]}  </Text>
}

// ── Field views ──────────────────────────────────────────────────────

function SelectFieldView({
  field, fs, symbol,
}: {
  field: SelectField; fs: FieldState; symbol: BarSymbol
}) {
  const colors = useTheme()
  const active = symbol === 'active'

  return (
    <Box flexDirection="column">
      <Box>
        <GBar kind={symbol} />
        <Text bold={active} color={active ? colors.primary : undefined}>{field.label}</Text>
        {field.description && !active && <Text dimColor>  {field.options[fs.selectIndex]?.label}</Text>}
      </Box>
      {active && field.description && (
        <Box>
          <GBar kind="bar" color={colors.primary} />
          <Text dimColor>{field.description}</Text>
        </Box>
      )}
      {active && field.options.map((opt, i) => {
        const sel = i === fs.selectIndex
        return (
          <Box key={opt.value}>
            <GBar kind="bar" color={colors.primary} />
            <Text color={sel ? colors.primary : 'gray'}>
              {sel ? '\u276F \u25C9' : '  \u25EF'} </Text>
            <Text color={sel ? colors.primary : undefined} bold={sel}>{opt.label}</Text>
          </Box>
        )
      })}
    </Box>
  )
}

function InputFieldView({
  field, fs, symbol,
}: {
  field: InputField; fs: FieldState; symbol: BarSymbol
}) {
  const colors = useTheme()
  const active = symbol === 'active'
  const hasError = symbol === 'error'

  return (
    <Box flexDirection="column">
      <Box>
        <GBar kind={symbol} />
        <Text bold={active || hasError} color={active ? colors.primary : hasError ? colors.warning : undefined}>
          {field.label}
        </Text>
        {!active && !hasError && fs.inputValue && <Text dimColor>  {fs.inputValue}</Text>}
      </Box>
      {(active || hasError) && field.description && (
        <Box>
          <GBar kind="bar" color={hasError ? colors.warning : colors.primary} />
          <Text dimColor>{field.description}</Text>
        </Box>
      )}
      {(active || hasError) && (
        <Box>
          <GBar kind="bar" color={hasError ? colors.warning : colors.primary} />
          <Text color={colors.primary}>{'\u276F'} </Text>
          <Text color={!fs.inputValue ? 'gray' : undefined}>
            {fs.inputValue || field.placeholder || ''}
          </Text>
          <Text color="gray">_</Text>
        </Box>
      )}
      {hasError && fs.error && (
        <Box>
          <GBar kind="bar" color={colors.warning} />
          <Text color={colors.error}>{fs.error}</Text>
        </Box>
      )}
    </Box>
  )
}

function MultiSelectFieldView({
  field, fs, symbol,
}: {
  field: MultiSelectField; fs: FieldState; symbol: BarSymbol
}) {
  const colors = useTheme()
  const active = symbol === 'active'

  const selectedLabels = field.options
    .filter(o => fs.multiSelected.has(o.value))
    .map(o => o.label)

  return (
    <Box flexDirection="column">
      <Box>
        <GBar kind={symbol} />
        <Text bold={active} color={active ? colors.primary : undefined}>{field.label}</Text>
        {!active && <Text dimColor>  {selectedLabels.length > 0 ? selectedLabels.join(', ') : 'none'}</Text>}
      </Box>
      {active && field.description && (
        <Box>
          <GBar kind="bar" color={colors.primary} />
          <Text dimColor>{field.description}</Text>
        </Box>
      )}
      {active && field.options.map((opt, i) => {
        const isCursor = i === fs.multiCursor
        const isChecked = fs.multiSelected.has(opt.value)
        return (
          <Box key={opt.value}>
            <GBar kind="bar" color={colors.primary} />
            <Text color={isCursor ? colors.primary : 'gray'}>{isCursor ? '\u276F' : ' '} </Text>
            <Text color={isChecked ? colors.success : 'gray'}>{isChecked ? '\u25A0' : '\u25A1'} </Text>
            <Text color={isCursor ? colors.primary : isChecked ? colors.success : undefined} bold={isCursor}>
              {opt.label}
            </Text>
          </Box>
        )
      })}
      {active && field.maxSelections && (
        <Box>
          <GBar kind="bar" color={colors.primary} />
          <Text dimColor>  {fs.multiSelected.size}/{field.maxSelections} selected</Text>
        </Box>
      )}
    </Box>
  )
}

function ConfirmFieldView({
  field, fs, symbol,
}: {
  field: ConfirmField; fs: FieldState; symbol: BarSymbol
}) {
  const colors = useTheme()
  const active = symbol === 'active'

  return (
    <Box flexDirection="column">
      <Box>
        <GBar kind={symbol} />
        <Text bold={active} color={active ? colors.primary : undefined}>{field.label}</Text>
        {!active && <Text dimColor>  {fs.confirmValue ? 'Yes' : 'No'}</Text>}
      </Box>
      {active && field.description && (
        <Box>
          <GBar kind="bar" color={colors.primary} />
          <Text dimColor>{field.description}</Text>
        </Box>
      )}
      {active && (
        <Box>
          <GBar kind="bar" color={colors.primary} />
          <Text
            color={fs.confirmValue ? colors.success : 'gray'}
            bold={fs.confirmValue}
            inverse={fs.confirmValue}
          >
            {' Yes '}
          </Text>
          <Text> </Text>
          <Text
            color={!fs.confirmValue ? colors.error : 'gray'}
            bold={!fs.confirmValue}
            inverse={!fs.confirmValue}
          >
            {' No '}
          </Text>
        </Box>
      )}
    </Box>
  )
}

function NoteFieldView({
  field, values, symbol,
}: {
  field: NoteField; values: Record<string, unknown>; symbol: BarSymbol
}) {
  const colors = useTheme()
  const active = symbol === 'active'
  const lines = field.render(values)

  return (
    <Box flexDirection="column">
      <Box>
        <GBar kind={symbol} />
        <Text bold={active} color={active ? colors.primary : undefined}>{field.label}</Text>
      </Box>
      {field.description && (
        <Box>
          <GBar kind="bar" color={active ? colors.primary : undefined} />
          <Text dimColor>{field.description}</Text>
        </Box>
      )}
      {lines.map((line, i) => (
        <Box key={i}>
          <GBar kind="bar" color={active ? colors.primary : undefined} />
          <Text color={colors.info}>{line}</Text>
        </Box>
      ))}
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

    if (key.tab && !key.shift) {
      if (fieldIndex < currentGroup.fields.length - 1) {
        dispatch({ type: 'next_field' })
      } else if (groupIndex < GROUPS.length - 1) {
        dispatch({ type: 'next_group' })
      }
      return
    }
    if (key.tab && key.shift) {
      if (fieldIndex > 0) {
        dispatch({ type: 'prev_field' })
      } else if (groupIndex > 0) {
        dispatch({ type: 'prev_group' })
      }
      return
    }

    switch (field.type) {
      case 'select': {
        const sf = field as SelectField
        if (key.upArrow || ch === 'k') {
          dispatch({ type: 'select_up', fieldId: field.id, max: sf.options.length })
        } else if (key.downArrow || ch === 'j') {
          dispatch({ type: 'select_down', fieldId: field.id, max: sf.options.length })
        } else if (key.return) {
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
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={colors.success}
          paddingX={2}
          paddingY={1}
          overflow="hidden"
        >
          <Box marginBottom={1}>
            <Text color={colors.success} bold>{'\u2714'} Deployed Successfully</Text>
          </Box>

          {GROUPS.map(group => (
            group.fields.map(field => {
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
                <Box key={field.id} flexDirection="column">
                  <Box>
                    <Text color={colors.success}>{'\u25C7'}  </Text>
                    <Text dimColor>{field.label}</Text>
                  </Box>
                  <Box>
                    <Text>   </Text>
                    <Text color={colors.info}>{displayValue}</Text>
                  </Box>
                </Box>
              )
            })
          ))}
        </Box>
      </Box>
    )
  }

  // ── Active form view ───────────────────────────────────────────────

  function getSymbol(i: number): BarSymbol {
    const field = currentGroup.fields[i]!
    const fs = getFieldState(state, field.id)
    if (i === fieldIndex) {
      return fs.error ? 'error' : 'active'
    }
    return i < fieldIndex ? 'done' : 'pending'
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.primary}
        paddingX={2}
        overflow="hidden"
      >
        {/* Header */}
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>{currentGroup.title}</Text>
          <Box gap={1}>
            <Text dimColor>{groupIndex + 1}/{GROUPS.length}</Text>
            <Box>
              {GROUPS.map((_, i) => (
                <Text key={i} color={i === groupIndex ? colors.primary : i < groupIndex ? colors.success : 'gray'}>
                  {i <= groupIndex ? '\u25CF' : '\u25CB'}
                </Text>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Fields with guide bar */}
        {currentGroup.fields.map((field, i) => {
          const symbol = getSymbol(i)
          const fs = getFieldState(state, field.id)

          const isLast = i === currentGroup.fields.length - 1

          return (
            <Box key={field.id} flexDirection="column">
              {(() => {
                switch (field.type) {
                  case 'select':
                    return <SelectFieldView field={field as SelectField} fs={fs} symbol={symbol} />
                  case 'input':
                    return <InputFieldView field={field as InputField} fs={fs} symbol={symbol} />
                  case 'multiselect':
                    return <MultiSelectFieldView field={field as MultiSelectField} fs={fs} symbol={symbol} />
                  case 'confirm':
                    return <ConfirmFieldView field={field as ConfirmField} fs={fs} symbol={symbol} />
                  case 'note':
                    return <NoteFieldView field={field as NoteField} values={values} symbol={symbol} />
                }
              })()}
              {!isLast && <Text dimColor>{'\u2502'}</Text>}
            </Box>
          )
        })}

        {/* Help */}
        <Box marginTop={1}>
          <Text dimColor>
            <Text bold>tab</Text> next  <Text bold>shift+tab</Text> back
            {'  '}
            {currentField?.type === 'select' && <><Text bold>{'\u2191'}/{'\u2193'}</Text> select  </>}
            {currentField?.type === 'multiselect' && <><Text bold>space</Text> toggle  <Text bold>{'\u2191'}/{'\u2193'}</Text> move  </>}
            {currentField?.type === 'input' && <><Text bold>type</Text> to enter  </>}
            {currentField?.type === 'confirm' && <><Text bold>y</Text>/<Text bold>n</Text> choose  </>}
            <Text bold>enter</Text> {groupIndex === GROUPS.length - 1 && fieldIndex === currentGroup.fields.length - 1 ? 'submit' : 'next'}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
