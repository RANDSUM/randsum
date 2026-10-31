import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RollRecord } from '@randsum/roller'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import { tokenize } from '@randsum/roller/tokenize'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { traceRoll } from '@randsum/roller/trace'
import type { RollTraceStep } from '@randsum/roller/trace'
import { TokenOverlayInput } from '../dice-ui/TokenOverlayInput'
import { tokenColor } from '../dice-ui/tokenColor'
import { useTheme } from '../dice-ui/useTheme'
import { buildStackBlitzProject } from '../../helpers/stackblitz'
import './HeroRoller.css'

// Slot machine tick intervals in ms: fast start, slowing to a stop (~2.5s total)
const SLOT_INTERVALS = [
  45, 50, 55, 60, 70, 80, 95, 115, 140, 170, 210, 260, 325, 410, 510, 640, 860
]

const DIE_ROLLED = 'die-rolled'
const CYCLE_MS = 12000

const HERO_PRESETS: readonly { readonly label: string; readonly notation: string }[] = [
  { label: 'Drop lowest', notation: '4d6L' },
  { label: 'Advantage', notation: '2d20H' },
  { label: 'Fudge', notation: '4dF' },
  { label: 'Exploding pool', notation: '8d8!U+5' },
  { label: 'Wild die', notation: '5d6W' },
  { label: 'Reroll ones', notation: '4d6R{1}' },
  { label: 'Percentile', notation: 'd%' },
  { label: 'Keep three', notation: '4d6K3' },
  { label: 'Escalating', notation: '1d4+1d6+1d8+1d10+1d12+1d20' },
  { label: 'Capped', notation: '3d8C{>6}' },
  { label: 'Geometric', notation: 'g6' },
  { label: 'Draw dice', notation: '5DD10' },
  { label: 'Something fancy', notation: '6d8L2H1R{1,2}U!C{>7}+5-2' }
]

interface HeroRoll {
  readonly id: number
  readonly notation: string
  readonly total: number
  readonly records: readonly RollRecord[]
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function openInStackBlitz(notation: string): void {
  const project = buildStackBlitzProject(notation)
  const params = new URLSearchParams({
    title: project.title,
    description: project.description,
    template: project.template
  })
  for (const [name, content] of Object.entries(project.files)) {
    params.set(`file[${name}]`, content)
  }
  window.open(`https://stackblitz.com/run?${params.toString()}`, '_blank', 'noopener,noreferrer')
}

function dice(
  values: readonly number[],
  variant: 'kept' | 'removed' | 'added'
): React.JSX.Element[] {
  return values.map((value, i) => (
    <span key={`${variant}-${i}`} className={`hr-die hr-die--${variant}`}>
      {value}
    </span>
  ))
}

function Step({
  step,
  label
}: {
  readonly step: RollTraceStep
  readonly label?: string
}): React.JSX.Element | null {
  if (step.kind === 'divider' || step.kind === 'finalRolls') return null
  if (step.kind === 'arithmetic') {
    return (
      <li className="hr-step">
        <span className="hr-step-label">{step.label}</span>
        <span className="hr-step-value">{step.display}</span>
      </li>
    )
  }
  const replacements = step.replacements ?? []
  return (
    <li className="hr-step">
      {label === undefined ? (
        <span className="hr-step-label">{step.label}</span>
      ) : (
        <code className="hr-step-label hr-step-label--notation">{label}</code>
      )}
      <span className="hr-dice">
        {replacements.map((r, i) => (
          <span key={`r-${i}`} className="hr-swap">
            <span className="hr-die hr-die--removed">{r.from}</span>
            <span className="hr-swap-arrow" aria-label="became">
              {'→'}
            </span>
            <span className="hr-die hr-die--added">{r.to}</span>
          </span>
        ))}
        {replacements.length === 0 && dice(step.removed, 'removed')}
        {replacements.length === 0 && dice(step.added, 'added')}
        {dice(step.unchanged, 'kept')}
      </span>
    </li>
  )
}

function Result({
  result,
  stale
}: {
  readonly result: HeroRoll | null
  readonly stale: boolean
}): React.JSX.Element {
  if (result === null) {
    return (
      <div className="hr-result hr-result--empty">
        <p className="hr-result-hint">Press Roll, or Enter, to see every step.</p>
      </div>
    )
  }
  const multiPool = result.records.length > 1
  return (
    <div
      key={result.id}
      className={['hr-result', stale ? 'hr-result--stale' : ''].filter(Boolean).join(' ')}
    >
      <div className="hr-total">
        <span className="hr-total-label">Total</span>
        <output className="hr-total-value" aria-label={`Total ${result.total}`}>
          {result.total}
        </output>
        <code className="hr-total-notation">{result.notation}</code>
      </div>
      <div className="hr-steps">
        {result.records.map((record, i) => {
          const steps = traceRoll(record).filter(
            step => step.kind !== 'divider' && step.kind !== 'finalRolls'
          )
          const [only] = steps
          // A plain pool in a multi-pool roll is one row: its notation and its dice
          if (multiPool && steps.length === 1 && only !== undefined) {
            return (
              <ol key={i} className="hr-pool-steps">
                <Step step={only} label={record.notation} />
              </ol>
            )
          }
          return (
            <section key={i} className="hr-pool" aria-label={record.notation}>
              {multiPool && (
                <h3 className="hr-pool-heading">
                  <code>{record.notation}</code>
                  <span>{record.total}</span>
                </h3>
              )}
              <ol className="hr-pool-steps">
                {steps.map((step, j) => (
                  <Step key={j} step={step} />
                ))}
              </ol>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export function HeroRoller(): React.JSX.Element {
  const theme = useTheme()
  const [notation, setNotation] = useState(HERO_PRESETS[0]?.notation ?? '4d6L')
  const [selected, setSelected] = useState<number | null>(0)
  const [result, setResult] = useState<HeroRoll | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const autoCyclingRef = useRef(true)
  const cycleRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const slotRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const rollIdRef = useRef(0)

  const tokens = useMemo(() => tokenize(notation), [notation])
  const isValid = notation.length > 0 && isDiceNotation(notation)
  const status = notation.length === 0 ? 'empty' : isValid ? 'valid' : 'invalid'

  const rollNotation = useCallback((value: string): void => {
    if (value.length === 0 || !isDiceNotation(value)) return
    try {
      const rolled = roll(value)
      rollIdRef.current += 1
      setResult({
        id: rollIdRef.current,
        notation: value,
        total: rolled.total,
        records: rolled.rolls
      })
    } catch {
      // isDiceNotation guards this; a throw leaves the last result in place
    }
  }, [])

  const choose = useCallback(
    (idx: number, rollIt: boolean): void => {
      const preset = HERO_PRESETS[idx]
      if (!preset) return
      setSelected(idx)
      setNotation(preset.notation)
      setHovered(null)
      if (rollIt) rollNotation(preset.notation)
    },
    [rollNotation]
  )

  const stopCycle = useCallback((): void => {
    autoCyclingRef.current = false
    if (cycleRef.current) {
      clearInterval(cycleRef.current)
      cycleRef.current = undefined
    }
  }, [])

  // The first preset is rolled on arrival, so the panel opens on a real result,
  // then a new preset is rolled every few seconds until the visitor takes over.
  useEffect(() => {
    rollNotation(HERO_PRESETS[0]?.notation ?? '4d6L')
    if (prefersReducedMotion()) return
    const cycle = { idx: 0 }
    cycleRef.current = setInterval(() => {
      if (!autoCyclingRef.current) return
      cycle.idx = (cycle.idx + 1) % HERO_PRESETS.length
      choose(cycle.idx, true)
    }, CYCLE_MS)
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current)
    }
  }, [choose, rollNotation])

  // Clicking the tagline spins through the presets like a slot machine
  useEffect(() => {
    const handler = (): void => {
      stopCycle()
      if (slotRef.current) clearTimeout(slotRef.current)
      const pick = (): number => roll(HERO_PRESETS.length).total - 1
      const finalIdx = pick()
      const step = { current: 0 }
      const tick = (): void => {
        if (step.current < SLOT_INTERVALS.length - 1) {
          choose(pick(), false)
          step.current++
          slotRef.current = setTimeout(tick, SLOT_INTERVALS[step.current])
        } else {
          choose(finalIdx, true)
        }
      }
      slotRef.current = setTimeout(tick, SLOT_INTERVALS[0] ?? 45)
    }
    window.addEventListener(DIE_ROLLED, handler)
    return () => {
      window.removeEventListener(DIE_ROLLED, handler)
      if (slotRef.current) clearTimeout(slotRef.current)
    }
  }, [choose, stopCycle])

  const stale = result !== null && result.notation !== notation

  return (
    <div className="hr">
      <form
        className={`hr-field hr-field--${status}`}
        onSubmit={e => {
          e.preventDefault()
          stopCycle()
          rollNotation(notation)
        }}
      >
        <div className="hr-input-wrap">
          <TokenOverlayInput tokens={tokens} hoveredTokenIdx={hovered} theme={theme}>
            <input
              type="text"
              className={['hr-input', tokens.length > 0 ? 'hr-input--highlight' : '']
                .filter(Boolean)
                .join(' ')}
              value={notation}
              onChange={e => {
                stopCycle()
                setSelected(null)
                setHovered(null)
                setNotation(e.target.value)
              }}
              placeholder="1d20+5"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Dice notation"
              aria-invalid={status === 'invalid'}
              aria-describedby="hr-meaning"
            />
          </TokenOverlayInput>
        </div>
        <button type="submit" className="hr-roll" disabled={!isValid}>
          Roll
        </button>
      </form>

      <div id="hr-meaning" className="hr-meaning">
        {status === 'empty' && (
          <span className="hr-meaning-hint">Type any notation, like 2d6+3</span>
        )}
        {status === 'invalid' && (
          <span className="hr-meaning-error">That is not valid notation yet</span>
        )}
        {status === 'valid' && (
          <ul className="hr-tokens" aria-label="What this notation means">
            {tokens
              .map((token, idx) => ({ token, idx }))
              .filter(({ token }) => token.description.length > 0)
              .map(({ token, idx }) => (
                <li
                  key={idx}
                  className={[
                    'hr-token',
                    hovered !== null && hovered !== idx ? 'hr-token--dim' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={
                    {
                      '--token-color': tokenColor(NOTATION_DOCS[token.key], theme)
                    } as React.CSSProperties
                  }
                  onMouseEnter={() => {
                    setHovered(idx)
                  }}
                  onMouseLeave={() => {
                    setHovered(null)
                  }}
                >
                  <code className="hr-token-text">{token.text}</code>
                  <span className="hr-token-desc">{token.description}</span>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="hr-result-region" role="status" aria-live="polite">
        <Result result={result} stale={stale} />
      </div>

      <div className="hr-footer">
        <div className="hr-presets" role="group" aria-label="Example rolls">
          {HERO_PRESETS.map((preset, i) => (
            <button
              key={preset.notation}
              type="button"
              className="hr-preset"
              aria-pressed={selected === i}
              title={preset.notation}
              onClick={() => {
                stopCycle()
                choose(i, true)
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="hr-stackblitz"
          disabled={!isValid}
          onClick={() => {
            openInStackBlitz(notation)
          }}
        >
          Edit in StackBlitz
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </button>
      </div>
    </div>
  )
}
