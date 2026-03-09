import { useReducer } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from '../theme'
import { Card, GBar, Separator, HelpFooter, type BarSymbol } from './utils'

/* ── Field types ── */

interface SelectOption { label: string; value: string }
interface BaseField { id: string; label: string; description?: string }
interface SelectField extends BaseField { type: 'select'; options: SelectOption[] }
interface InputField extends BaseField { type: 'input'; placeholder?: string; validate?: (v: string) => string | null }
interface MultiSelectField extends BaseField { type: 'multiselect'; options: SelectOption[]; maxSelections?: number }
interface ConfirmField extends BaseField { type: 'confirm' }
interface NoteField extends BaseField { type: 'note'; render: (values: Record<string, unknown>) => string[] }
type Field = SelectField | InputField | MultiSelectField | ConfirmField | NoteField

interface Group { title: string; fields: Field[] }

/* ── State ── */

interface FieldState {
  selectIndex: number; inputValue: string; multiSelected: Set<string>
  multiCursor: number; confirmValue: boolean; error: string | null
}

interface State {
  groupIndex: number; fieldIndex: number
  fieldStates: Record<string, FieldState>; submitted: boolean
}

type Action =
  | { type: 'next_field' } | { type: 'prev_field' }
  | { type: 'next_group' } | { type: 'prev_group' }
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

function getFS(state: State, id: string): FieldState {
  return state.fieldStates[id] ?? {
    selectIndex: 0, inputValue: '', multiSelected: new Set<string>(),
    multiCursor: 0, confirmValue: false, error: null,
  }
}

function updFS(state: State, id: string, patch: Partial<FieldState>): State {
  return { ...state, fieldStates: { ...state.fieldStates, [id]: { ...getFS(state, id), ...patch } } }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next_field': return { ...state, fieldIndex: state.fieldIndex + 1 }
    case 'prev_field': return { ...state, fieldIndex: state.fieldIndex - 1 }
    case 'next_group': return { ...state, groupIndex: state.groupIndex + 1, fieldIndex: 0 }
    case 'prev_group': return { ...state, groupIndex: state.groupIndex - 1, fieldIndex: 0 }
    case 'select_up': { const fs = getFS(state, action.fieldId); return updFS(state, action.fieldId, { selectIndex: Math.max(0, fs.selectIndex - 1) }) }
    case 'select_down': { const fs = getFS(state, action.fieldId); return updFS(state, action.fieldId, { selectIndex: Math.min(action.max - 1, fs.selectIndex + 1) }) }
    case 'multi_up': { const fs = getFS(state, action.fieldId); return updFS(state, action.fieldId, { multiCursor: Math.max(0, fs.multiCursor - 1) }) }
    case 'multi_down': { const fs = getFS(state, action.fieldId); return updFS(state, action.fieldId, { multiCursor: Math.min(action.max - 1, fs.multiCursor + 1) }) }
    case 'multi_toggle': {
      const fs = getFS(state, action.fieldId); const next = new Set(fs.multiSelected)
      if (next.has(action.value)) next.delete(action.value)
      else { if (action.maxSelections && next.size >= action.maxSelections) return state; next.add(action.value) }
      return updFS(state, action.fieldId, { multiSelected: next })
    }
    case 'input_char': { const fs = getFS(state, action.fieldId); return updFS(state, action.fieldId, { inputValue: fs.inputValue + action.char, error: null }) }
    case 'input_backspace': { const fs = getFS(state, action.fieldId); return updFS(state, action.fieldId, { inputValue: fs.inputValue.slice(0, -1), error: null }) }
    case 'set_error': return updFS(state, action.fieldId, { error: action.error })
    case 'confirm_toggle': { const fs = getFS(state, action.fieldId); return updFS(state, action.fieldId, { confirmValue: !fs.confirmValue }) }
    case 'confirm_set': return updFS(state, action.fieldId, { confirmValue: action.value })
    case 'submit': return { ...state, submitted: true }
  }
}

/* ── Demo data ── */

const GROUPS: Group[] = [
  {
    title: 'Service',
    fields: [
      { id: 'environment', type: 'select', label: 'Environment', description: 'Target deployment environment',
        options: [{ label: 'Development', value: 'dev' }, { label: 'Staging', value: 'staging' }, { label: 'Production', value: 'prod' }] },
      { id: 'service_name', type: 'input', label: 'Service Name', description: 'Unique name (no spaces)', placeholder: 'my-service',
        validate: (v) => !v.trim() ? 'Required' : /\s/.test(v) ? 'No spaces' : null },
    ],
  },
  {
    title: 'Options',
    fields: [
      { id: 'features', type: 'multiselect', label: 'Features', description: 'Enable features (max 3)', maxSelections: 3,
        options: [{ label: 'Logging', value: 'logging' }, { label: 'Monitoring', value: 'monitoring' }, { label: 'Auto-scaling', value: 'autoscaling' }, { label: 'CDN', value: 'cdn' }, { label: 'Rate Limiting', value: 'ratelimiting' }] },
      { id: 'replicas', type: 'input', label: 'Replicas', description: 'Number of replicas (1-10)', placeholder: '3',
        validate: (v) => { if (!v.trim()) return 'Required'; const n = parseInt(v, 10); return isNaN(n) || n < 1 || n > 10 ? 'Must be 1-10' : null } },
    ],
  },
  {
    title: 'Confirm',
    fields: [
      { id: 'summary', type: 'note', label: 'Deploy Summary', description: 'Review your selections',
        render: (vals) => [
          `Environment:  ${vals['environment'] ?? 'not set'}`,
          `Service Name: ${(vals['service_name'] as string) || 'not set'}`,
          `Features:     ${vals['features'] && (vals['features'] as Set<string>).size > 0 ? [...(vals['features'] as Set<string>)].join(', ') : 'none'}`,
          `Replicas:     ${(vals['replicas'] as string) || 'not set'}`,
        ] },
      { id: 'deploy_confirm', type: 'confirm', label: 'Deploy now?', description: 'This will start the deployment' },
    ],
  },
]

function collectValues(fs: Record<string, FieldState>): Record<string, unknown> {
  const v: Record<string, unknown> = {}
  for (const g of GROUPS) for (const f of g.fields) {
    const s = fs[f.id]; if (!s) continue
    if (f.type === 'select') v[f.id] = (f as SelectField).options[s.selectIndex]?.label ?? ''
    else if (f.type === 'input') v[f.id] = s.inputValue
    else if (f.type === 'multiselect') v[f.id] = s.multiSelected
    else if (f.type === 'confirm') v[f.id] = s.confirmValue
  }
  return v
}

/* ── Sub-views ── */

function SelectView({ field, fs, symbol }: { field: SelectField; fs: FieldState; symbol: BarSymbol }) {
  const colors = useTheme(); const active = symbol === 'active'
  return (
    <Box flexDirection="column">
      <Box><GBar kind={symbol} /><Text bold={active} color={active ? colors.primary : undefined}>{field.label}</Text>
        {!active && <Text dimColor>  {field.options[fs.selectIndex]?.label}</Text>}</Box>
      {active && field.description && <Box><GBar kind="bar" color={colors.primary} /><Text dimColor>{field.description}</Text></Box>}
      {active && field.options.map((o, i) => {
        const sel = i === fs.selectIndex
        return <Box key={o.value}><GBar kind="bar" color={colors.primary} /><Text color={sel ? colors.primary : 'gray'}>{sel ? '\u276F \u25C9' : '  \u25EF'} </Text><Text color={sel ? colors.primary : undefined} bold={sel}>{o.label}</Text></Box>
      })}
    </Box>
  )
}

function InputView({ field, fs, symbol }: { field: InputField; fs: FieldState; symbol: BarSymbol }) {
  const colors = useTheme(); const active = symbol === 'active'; const hasErr = symbol === 'error'
  const barColor = hasErr ? colors.warning : colors.primary
  return (
    <Box flexDirection="column">
      <Box><GBar kind={symbol} /><Text bold={active || hasErr} color={active ? colors.primary : hasErr ? colors.warning : undefined}>{field.label}</Text>
        {!active && !hasErr && fs.inputValue && <Text dimColor>  {fs.inputValue}</Text>}</Box>
      {(active || hasErr) && field.description && <Box><GBar kind="bar" color={barColor} /><Text dimColor>{field.description}</Text></Box>}
      {(active || hasErr) && <Box><GBar kind="bar" color={barColor} /><Text color={colors.primary}>{'\u276F'} </Text><Text color={!fs.inputValue ? 'gray' : undefined}>{fs.inputValue || field.placeholder || ''}</Text><Text color="gray">_</Text></Box>}
      {hasErr && fs.error && <Box><GBar kind="bar" color={barColor} /><Text color={colors.error}>{fs.error}</Text></Box>}
    </Box>
  )
}

function MultiSelectView({ field, fs, symbol }: { field: MultiSelectField; fs: FieldState; symbol: BarSymbol }) {
  const colors = useTheme(); const active = symbol === 'active'
  const selectedLabels = field.options.filter(o => fs.multiSelected.has(o.value)).map(o => o.label)
  return (
    <Box flexDirection="column">
      <Box><GBar kind={symbol} /><Text bold={active} color={active ? colors.primary : undefined}>{field.label}</Text>
        {!active && <Text dimColor>  {selectedLabels.length > 0 ? selectedLabels.join(', ') : 'none'}</Text>}</Box>
      {active && field.description && <Box><GBar kind="bar" color={colors.primary} /><Text dimColor>{field.description}</Text></Box>}
      {active && field.options.map((o, i) => {
        const cur = i === fs.multiCursor; const chk = fs.multiSelected.has(o.value)
        return <Box key={o.value}><GBar kind="bar" color={colors.primary} /><Text color={cur ? colors.primary : 'gray'}>{cur ? '\u276F' : ' '} </Text><Text color={chk ? colors.success : 'gray'}>{chk ? '\u25A0' : '\u25A1'} </Text><Text color={cur ? colors.primary : chk ? colors.success : undefined} bold={cur}>{o.label}</Text></Box>
      })}
      {active && field.maxSelections && <Box><GBar kind="bar" color={colors.primary} /><Text dimColor>  {fs.multiSelected.size}/{field.maxSelections} selected</Text></Box>}
    </Box>
  )
}

function ConfirmView({ field, fs, symbol }: { field: ConfirmField; fs: FieldState; symbol: BarSymbol }) {
  const colors = useTheme(); const active = symbol === 'active'
  return (
    <Box flexDirection="column">
      <Box><GBar kind={symbol} /><Text bold={active} color={active ? colors.primary : undefined}>{field.label}</Text>
        {!active && <Text dimColor>  {fs.confirmValue ? 'Yes' : 'No'}</Text>}</Box>
      {active && field.description && <Box><GBar kind="bar" color={colors.primary} /><Text dimColor>{field.description}</Text></Box>}
      {active && <Box><GBar kind="bar" color={colors.primary} /><Text color={fs.confirmValue ? colors.success : 'gray'} bold={fs.confirmValue} inverse={fs.confirmValue}>{' Yes '}</Text><Text> </Text><Text color={!fs.confirmValue ? colors.error : 'gray'} bold={!fs.confirmValue} inverse={!fs.confirmValue}>{' No '}</Text></Box>}
    </Box>
  )
}

function NoteView({ field, values, symbol }: { field: NoteField; values: Record<string, unknown>; symbol: BarSymbol }) {
  const colors = useTheme(); const active = symbol === 'active'; const lines = field.render(values)
  return (
    <Box flexDirection="column">
      <Box><GBar kind={symbol} /><Text bold={active} color={active ? colors.primary : undefined}>{field.label}</Text></Box>
      {field.description && <Box><GBar kind="bar" color={active ? colors.primary : undefined} /><Text dimColor>{field.description}</Text></Box>}
      {lines.map((l, i) => <Box key={i}><GBar kind="bar" color={active ? colors.primary : undefined} /><Text color={colors.info}>{l}</Text></Box>)}
    </Box>
  )
}

/* ── Main ── */

export function ModernFormBuilder() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, { groupIndex: 0, fieldIndex: 0, fieldStates: {}, submitted: false })
  const { groupIndex, fieldIndex, submitted, fieldStates } = state
  const currentGroup = GROUPS[groupIndex]!
  const currentField = currentGroup.fields[fieldIndex]
  const values = collectValues(fieldStates)

  useInput((ch, key) => {
    if (submitted) return
    const field = currentField; if (!field) return
    const fs = getFS(state, field.id)

    if (key.tab && !key.shift) {
      if (fieldIndex < currentGroup.fields.length - 1) dispatch({ type: 'next_field' })
      else if (groupIndex < GROUPS.length - 1) dispatch({ type: 'next_group' })
      return
    }
    if (key.tab && key.shift) {
      if (fieldIndex > 0) dispatch({ type: 'prev_field' })
      else if (groupIndex > 0) dispatch({ type: 'prev_group' })
      return
    }

    switch (field.type) {
      case 'select': {
        if (key.upArrow || ch === 'k') dispatch({ type: 'select_up', fieldId: field.id, max: (field as SelectField).options.length })
        else if (key.downArrow || ch === 'j') dispatch({ type: 'select_down', fieldId: field.id, max: (field as SelectField).options.length })
        else if (key.return) { if (fieldIndex < currentGroup.fields.length - 1) dispatch({ type: 'next_field' }); else if (groupIndex < GROUPS.length - 1) dispatch({ type: 'next_group' }) }
        break
      }
      case 'input': {
        const inf = field as InputField
        if (key.return) {
          if (inf.validate) { const err = inf.validate(fs.inputValue); if (err) { dispatch({ type: 'set_error', fieldId: field.id, error: err }); return } }
          dispatch({ type: 'set_error', fieldId: field.id, error: null })
          if (fieldIndex < currentGroup.fields.length - 1) dispatch({ type: 'next_field' }); else if (groupIndex < GROUPS.length - 1) dispatch({ type: 'next_group' })
        } else if (key.backspace || key.delete) dispatch({ type: 'input_backspace', fieldId: field.id })
        else if (ch && !key.ctrl && !key.meta && !key.escape) dispatch({ type: 'input_char', fieldId: field.id, char: ch })
        break
      }
      case 'multiselect': {
        const mf = field as MultiSelectField
        if (key.upArrow || ch === 'k') dispatch({ type: 'multi_up', fieldId: field.id, max: mf.options.length })
        else if (key.downArrow || ch === 'j') dispatch({ type: 'multi_down', fieldId: field.id, max: mf.options.length })
        else if (ch === ' ') { const o = mf.options[fs.multiCursor]; if (o) dispatch({ type: 'multi_toggle', fieldId: field.id, value: o.value, maxSelections: mf.maxSelections }) }
        else if (key.return) { if (fieldIndex < currentGroup.fields.length - 1) dispatch({ type: 'next_field' }); else if (groupIndex < GROUPS.length - 1) dispatch({ type: 'next_group' }) }
        break
      }
      case 'confirm': {
        if (ch === 'y') dispatch({ type: 'confirm_set', fieldId: field.id, value: true })
        else if (ch === 'n') dispatch({ type: 'confirm_set', fieldId: field.id, value: false })
        else if (key.leftArrow || key.rightArrow) dispatch({ type: 'confirm_toggle', fieldId: field.id })
        else if (key.return) {
          if (groupIndex === GROUPS.length - 1 && fieldIndex === currentGroup.fields.length - 1) dispatch({ type: 'submit' })
          else if (fieldIndex < currentGroup.fields.length - 1) dispatch({ type: 'next_field' }); else if (groupIndex < GROUPS.length - 1) dispatch({ type: 'next_group' })
        }
        break
      }
      case 'note': {
        if (key.return) { if (fieldIndex < currentGroup.fields.length - 1) dispatch({ type: 'next_field' }); else if (groupIndex < GROUPS.length - 1) dispatch({ type: 'next_group' }) }
        break
      }
    }
  })

  if (submitted) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Card borderColor={colors.success}>
          <Box marginBottom={1}><Text color={colors.success} bold>{'\u2714'} Deployed Successfully</Text></Box>
          {GROUPS.map(g => g.fields.map(f => {
            if (f.type === 'note') return null
            const fs = getFS(state, f.id)
            let val = ''
            if (f.type === 'select') val = (f as SelectField).options[fs.selectIndex]?.label ?? ''
            else if (f.type === 'input') val = fs.inputValue || '(empty)'
            else if (f.type === 'multiselect') val = fs.multiSelected.size > 0 ? [...fs.multiSelected].join(', ') : '(none)'
            else if (f.type === 'confirm') val = fs.confirmValue ? 'Yes' : 'No'
            return <Box key={f.id} flexDirection="column"><Box><GBar kind="done" /><Text dimColor>{f.label}</Text></Box><Box><Text>   </Text><Text color={colors.info}>{val}</Text></Box></Box>
          }))}
        </Card>
      </Box>
    )
  }

  function getSymbol(i: number): BarSymbol {
    const f = currentGroup.fields[i]!; const fs = getFS(state, f.id)
    if (i === fieldIndex) return fs.error ? 'error' : 'active'
    return i < fieldIndex ? 'done' : 'pending'
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Card>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.primary}>{currentGroup.title}</Text>
          <Box gap={1}>
            <Text dimColor>{groupIndex + 1}/{GROUPS.length}</Text>
            <Box>{GROUPS.map((_, i) => <Text key={i} color={i === groupIndex ? colors.primary : i < groupIndex ? colors.success : 'gray'}>{i <= groupIndex ? '\u25CF' : '\u25CB'}</Text>)}</Box>
          </Box>
        </Box>

        {currentGroup.fields.map((field, i) => {
          const sym = getSymbol(i); const fs = getFS(state, field.id)
          return (
            <Box key={field.id} flexDirection="column">
              {field.type === 'select' && <SelectView field={field as SelectField} fs={fs} symbol={sym} />}
              {field.type === 'input' && <InputView field={field as InputField} fs={fs} symbol={sym} />}
              {field.type === 'multiselect' && <MultiSelectView field={field as MultiSelectField} fs={fs} symbol={sym} />}
              {field.type === 'confirm' && <ConfirmView field={field as ConfirmField} fs={fs} symbol={sym} />}
              {field.type === 'note' && <NoteView field={field as NoteField} values={values} symbol={sym} />}
              {i < currentGroup.fields.length - 1 && <Text dimColor>{'\u2502'}</Text>}
            </Box>
          )
        })}

        <HelpFooter keys={[
          { key: 'tab', label: 'next' }, { key: 'shift+tab', label: 'back' },
          { key: '\u2191/\u2193', label: 'select' }, { key: 'enter', label: groupIndex === GROUPS.length - 1 && fieldIndex === currentGroup.fields.length - 1 ? 'submit' : 'next' },
        ]} />
      </Card>
    </Box>
  )
}
