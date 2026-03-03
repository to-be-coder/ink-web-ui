import { useReducer, useEffect, useRef, useState, useCallback } from 'react'
import { Box, Text, useInput } from 'ink-web'
import { useTheme } from './theme'

interface Transcript {
  id: number
  text: string
}

interface State {
  listening: boolean
  supported: boolean
  transcripts: Transcript[]
  interim: string
  error: string
  startTime: number
  demo: boolean
}

type Action =
  | { type: 'start'; time: number }
  | { type: 'stop' }
  | { type: 'interim'; text: string }
  | { type: 'result'; text: string }
  | { type: 'error'; message: string }
  | { type: 'unsupported' }
  | { type: 'clear' }
  | { type: 'start_demo'; time: number }
  | { type: 'stop_demo' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { ...state, listening: true, error: '', interim: '', startTime: action.time, demo: false }
    case 'stop':
      return { ...state, listening: false, interim: '', demo: false }
    case 'interim':
      return { ...state, interim: action.text }
    case 'result': {
      if (!action.text.trim()) return state
      return {
        ...state,
        interim: '',
        transcripts: [
          ...state.transcripts,
          { id: Date.now(), text: action.text.trim() },
        ],
      }
    }
    case 'error':
      return { ...state, listening: false, error: action.message, interim: '' }
    case 'unsupported':
      return { ...state, supported: false }
    case 'clear':
      return { ...state, transcripts: [], interim: '', error: '' }
    case 'start_demo':
      return { ...state, listening: true, demo: true, error: '', interim: '', transcripts: [], startTime: action.time }
    case 'stop_demo':
      return { ...state, listening: false, demo: false, interim: '' }
  }
}

const INITIAL: State = {
  listening: false,
  supported: true,
  transcripts: [],
  interim: '',
  error: '',
  startTime: 0,
  demo: false,
}

const BAR_COUNT = 16
const BLOCKS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
const MAX_VISIBLE = 5

const DEMO_PHRASES = [
  'Hello, can you help me refactor the authentication module?',
  'I need to add rate limiting to the API endpoints.',
  'Let me check the test coverage for the new feature.',
  'Deploy the staging build and run integration tests.',
]

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const tenths = Math.floor((ms % 1000) / 100)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${tenths}`
}

function Waveform({ levels }: { levels: number[] }) {
  const colors = useTheme()
  return (
    <Box gap={0}>
      {levels.map((l, i) => {
        const idx = Math.round(l * (BLOCKS.length - 1))
        return (
          <Text key={i} color={l > 0.01 ? colors.primary : 'gray'}>
            {BLOCKS[idx]}
          </Text>
        )
      })}
    </Box>
  )
}

export function VoiceRecognition() {
  const colors = useTheme()
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const { listening, supported, transcripts, interim, error, startTime, demo } = state
  const [levels, setLevels] = useState<number[]>(new Array(BAR_COUNT).fill(0))
  const [elapsed, setElapsed] = useState(0)
  const recognitionRef = useRef<any>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const demoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const demoLevelsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0))

  useEffect(() => {
    const SpeechRecognition =
      (globalThis as any).SpeechRecognition ||
      (globalThis as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      dispatch({ type: 'unsupported' })
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          dispatch({ type: 'result', text: result[0].transcript })
        } else {
          interimText += result[0].transcript
        }
      }
      if (interimText) {
        dispatch({ type: 'interim', text: interimText })
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return
      dispatch({ type: 'error', message: event.error })
    }

    recognition.onend = () => {
      dispatch({ type: 'stop' })
    }

    recognitionRef.current = recognition
    return () => recognition.abort()
  }, [])

  const startAudioLevel = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      streamRef.current = stream
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser

      const data = new Uint8Array(analyser.frequencyBinCount)
      function tick() {
        analyser.getByteFrequencyData(data)
        const bars: number[] = []
        const binSize = Math.floor(data.length / BAR_COUNT)
        for (let b = 0; b < BAR_COUNT; b++) {
          let sum = 0
          for (let j = 0; j < binSize; j++) {
            sum += data[b * binSize + j]!
          }
          bars.push((sum / binSize) / 255)
        }
        setLevels(bars)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    }).catch(() => {})
  }, [])

  const stopAudioLevel = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setLevels(new Array(BAR_COUNT).fill(0))
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
  }, [])

  const stopDemo = useCallback(() => {
    if (demoRef.current) {
      clearInterval(demoRef.current)
      demoRef.current = null
    }
    setLevels(new Array(BAR_COUNT).fill(0))
    demoLevelsRef.current = new Array(BAR_COUNT).fill(0)
    dispatch({ type: 'stop_demo' })
  }, [])

  const startDemo = useCallback(() => {
    dispatch({ type: 'start_demo', time: Date.now() })

    let phraseIdx = 0
    let charIdx = 0
    let pauseTicks = 0
    const GAP_TICKS = 8

    demoRef.current = setInterval(() => {
      // Animate waveform with smooth random values
      const speaking = pauseTicks === 0
      const prev = demoLevelsRef.current
      const next = prev.map((v, i) => {
        if (!speaking) return v * 0.85
        const target = 0.15 + Math.random() * 0.65 + Math.sin(Date.now() / 200 + i) * 0.15
        return v * 0.4 + target * 0.6
      })
      demoLevelsRef.current = next
      setLevels([...next])

      if (pauseTicks > 0) {
        pauseTicks--
        if (pauseTicks === 0) {
          charIdx = 0
          phraseIdx++
          if (phraseIdx >= DEMO_PHRASES.length) {
            stopDemo()
          }
        }
        return
      }

      const phrase = DEMO_PHRASES[phraseIdx]
      if (!phrase) return

      // Stream 2-3 chars per tick
      const step = 2 + Math.floor(Math.random() * 2)
      charIdx = Math.min(charIdx + step, phrase.length)
      dispatch({ type: 'interim', text: phrase.slice(0, charIdx) })

      if (charIdx >= phrase.length) {
        dispatch({ type: 'result', text: phrase })
        pauseTicks = GAP_TICKS
      }
    }, 60)
  }, [stopDemo])

  useEffect(() => {
    return () => stopAudioLevel()
  }, [stopAudioLevel])

  useEffect(() => {
    return () => {
      if (demoRef.current) clearInterval(demoRef.current)
    }
  }, [])

  useEffect(() => {
    if (listening && startTime > 0) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime)
      }, 100)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (!listening) setElapsed(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [listening, startTime])

  useInput((ch) => {
    if (ch === 'd') {
      if (demo) {
        stopDemo()
      } else if (!listening) {
        startDemo()
      }
      return
    }
    if (ch === ' ') {
      if (demo) {
        stopDemo()
        return
      }
      const recognition = recognitionRef.current
      if (!recognition) return
      if (listening) {
        recognition.stop()
        stopAudioLevel()
      } else {
        try {
          recognition.start()
          dispatch({ type: 'start', time: Date.now() })
          startAudioLevel()
        } catch {
          dispatch({ type: 'error', message: 'Failed to start' })
        }
      }
    } else if (ch === 'c') {
      dispatch({ type: 'clear' })
    }
  })

  if (!supported && !listening) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box gap={1}>
          <Text color={colors.error}>✘</Text>
          <Text bold>Voice Recognition</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Speech recognition is not supported in this browser.</Text>
        </Box>
        <Box marginTop={1} gap={1}>
          <Text dimColor>Press <Text bold>d</Text> to run a simulated demo.</Text>
        </Box>
      </Box>
    )
  }

  const visible = transcripts.slice(-MAX_VISIBLE)
  const hidden = transcripts.length - MAX_VISIBLE

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} gap={1}>
        <Text color={listening ? colors.primary : 'gray'}>{listening ? '●' : '○'}</Text>
        <Text bold>Voice Recognition</Text>
        {demo && <Text color={colors.warning}>demo</Text>}
        {listening && <Text color={colors.primary}>{formatDuration(elapsed)}</Text>}
        {!listening && transcripts.length === 0 && <Text dimColor>Ready</Text>}
        {!listening && transcripts.length > 0 && (
          <Text dimColor>{transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''}</Text>
        )}
      </Box>

      <Box marginBottom={1}>
        <Text>  </Text>
        <Waveform levels={listening ? levels : new Array(BAR_COUNT).fill(0)} />
      </Box>

      {error && (
        <Box gap={1} marginBottom={1}>
          <Text>  </Text>
          <Text color={colors.error}>✘</Text>
          <Text color={colors.error}>{error}</Text>
        </Box>
      )}

      {transcripts.length === 0 && !interim && !listening && !error && (
        <Box>
          <Text dimColor>  Press space to start listening, or d for demo.</Text>
        </Box>
      )}

      {(visible.length > 0 || interim) && (
        <Box flexDirection="column">
          {hidden > 0 && <Text dimColor>  … {hidden} earlier</Text>}
          {visible.map((t) => (
            <Box key={t.id} gap={1}>
              <Text>  </Text>
              <Text color={colors.success}>✔</Text>
              <Text>{t.text}</Text>
            </Box>
          ))}
          {interim && (
            <Box gap={1}>
              <Text>  </Text>
              <Text color={colors.primary}>›</Text>
              <Text dimColor>{interim}</Text>
            </Box>
          )}
        </Box>
      )}

      <Box marginTop={1} gap={1}>
        <Text dimColor>
          <Text bold>space</Text> {listening ? 'stop' : 'listen'}
          {'  '}<Text bold>d</Text> demo
          {transcripts.length > 0 && (<Text>  <Text bold>c</Text> clear</Text>)}
        </Text>
      </Box>
    </Box>
  )
}
