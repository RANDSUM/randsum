import { useCallback, useEffect, useRef, useState } from 'react'
// useState/useEffect used by main component; RollTooltip is now stateless
import { isDiceNotation, roll, validateNotation } from '@randsum/roller'
import type { RollRecord } from '@randsum/roller'
import './RollerPlayground.css'

type PlaygroundState =
  | { status: 'idle' }
  | { status: 'rolling' }
  | { status: 'result'; total: number; record: RollRecord }

function tooltipDir(el: HTMLElement): 'above' | 'below' {
  return el.getBoundingClientRect().top < window.innerHeight / 2 ? 'below' : 'above'
}

export function RollerPlayground(): React.JSX.Element {
  const [notation, setNotation] = useState('4d6L')
  const [state, setState] = useState<PlaygroundState>({ status: 'idle' })
  const [showTooltip, setShowTooltip] = useState(false)
  const [showInputTooltip, setShowInputTooltip] = useState(false)
  const [chipDir, setChipDir] = useState<'above' | 'below'>('above')
  const [inputDir, setInputDir] = useState<'above' | 'below'>('above')
  const chipRef = useRef<HTMLDivElement>(null)
  const inputWrapRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const isValid = notation.length > 0 && isDiceNotation(notation)
  const shellVariant = notation.length === 0 ? 'empty' : isValid ? 'valid' : 'invalid'

  const handleRoll = useCallback(() => {
    if (!isValid) return
    setState({ status: 'rolling' })
    setShowTooltip(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const result = roll(notation)
      if (result.error || !result.rolls[0]) return
      setState({ status: 'result', total: result.total, record: result.rolls[0] })
    }, 300)
  }, [notation, isValid])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotation(e.target.value)
    setState({ status: 'idle' })
    setShowTooltip(false)
  }, [])

  return (
    <div className="roller-playground">
      <div className={`roller-playground-shell roller-playground-shell--${shellVariant}`}>
        <div className="roller-playground-input-wrap" ref={inputWrapRef}>
          <input
            type="text"
            className="roller-playground-input"
            value={notation}
            onChange={handleChange}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRoll()
            }}
            onMouseEnter={() => {
              if (inputWrapRef.current) setInputDir(tooltipDir(inputWrapRef.current))
              setShowInputTooltip(true)
            }}
            onMouseLeave={() => {
              setShowInputTooltip(false)
            }}
            placeholder="4d6L"
            spellCheck={false}
            autoComplete="off"
            aria-label="Dice notation"
          />
          {showInputTooltip && (
            <div
              className={`roller-playground-tooltip roller-playground-tooltip--${inputDir}`}
              role="tooltip"
            >
              <div className="roller-tooltip-inner">
                {notation.length === 0 ? (
                  <span className="roller-tooltip-hint">Try: 4d6L, 1d20+5, 2d8!</span>
                ) : isValid ? (
                  (() => {
                    const result = validateNotation(notation)
                    const lines = result.valid ? result.description.flat() : []
                    return lines.length > 0 ? (
                      <span className="roller-tooltip-valid">{lines.join(', ')}</span>
                    ) : (
                      <span className="roller-tooltip-valid">{notation}</span>
                    )
                  })()
                ) : (
                  <span className="roller-tooltip-invalid">Invalid notation</span>
                )}
              </div>
            </div>
          )}
        </div>

        {state.status === 'result' && (
          <div
            ref={chipRef}
            className="roller-playground-chip"
            onMouseEnter={() => {
              if (chipRef.current) setChipDir(tooltipDir(chipRef.current))
              setShowTooltip(true)
            }}
            onMouseLeave={() => {
              setShowTooltip(false)
            }}
          >
            <span className="roller-playground-chip-value">{state.total}</span>
            {showTooltip && (
              <div
                className={`roller-playground-tooltip roller-playground-tooltip--${chipDir}`}
                role="tooltip"
              >
                <RollTooltip record={state.record} />
              </div>
            )}
          </div>
        )}

        <button
          className="roller-playground-btn"
          onClick={handleRoll}
          disabled={!isValid || state.status === 'rolling'}
          aria-label={
            state.status === 'rolling' ? 'Rolling' : state.status === 'result' ? 'Reroll' : 'Roll'
          }
        >
          {state.status === 'rolling' ? (
            <span className="roller-playground-spinner" aria-hidden="true" />
          ) : state.status === 'result' ? (
            'Reroll'
          ) : (
            'Roll'
          )}
        </button>
      </div>
    </div>
  )
}

type TooltipStep =
  | {
      kind: 'rolls'
      label: string
      unchanged: readonly number[]
      removed: readonly number[]
      added: readonly number[]
    }
  | { kind: 'divider' }
  | { kind: 'arithmetic'; label: string; display: string }
  | { kind: 'finalRolls'; rolls: readonly number[]; arithmeticDelta: number }
  | { kind: 'total'; value: number }

const ARITHMETIC_MODIFIERS: Partial<Record<string, { label: string; sign: string }>> = {
  plus: { label: 'Add', sign: '+' },
  minus: { label: 'Subtract', sign: '-' },
  multiply: { label: 'Multiply', sign: '×' },
  multiplyTotal: { label: 'Multiply total', sign: '×' }
}

const MAX_DICE_SHOWN = 10

function formatAsMath(rolls: readonly number[], delta = 0): string {
  const terms = rolls.map((n, i) => {
    if (i === 0) return String(n)
    return n < 0 ? ` - ${Math.abs(n)}` : ` + ${n}`
  })
  if (delta > 0) terms.push(` + ${delta}`)
  if (delta < 0) terms.push(` - ${Math.abs(delta)}`)
  return terms.join('')
}

function computeSteps(record: RollRecord): readonly TooltipStep[] {
  const steps: TooltipStep[] = []
  const current: number[] = [...record.modifierHistory.initialRolls]

  steps.push({ kind: 'rolls', label: 'Rolled', unchanged: [...current], removed: [], added: [] })

  const modifierSteps: TooltipStep[] = []

  for (const log of record.modifierHistory.logs) {
    const arith = ARITHMETIC_MODIFIERS[log.modifier]
    if (arith) {
      const value = log.options as number
      modifierSteps.push({
        kind: 'arithmetic',
        label: arith.label,
        display: `${arith.sign}${value}`
      })
      continue
    }
    if (log.removed.length === 0 && log.added.length === 0) continue
    for (const val of log.removed) {
      const idx = current.indexOf(val)
      if (idx !== -1) current.splice(idx, 1)
    }
    current.push(...log.added)

    const unchanged = [...current]
    for (const val of log.added) {
      const idx = unchanged.indexOf(val)
      if (idx !== -1) unchanged.splice(idx, 1)
    }

    const label = log.modifier.charAt(0).toUpperCase() + log.modifier.slice(1)
    modifierSteps.push({ kind: 'rolls', label, unchanged, removed: log.removed, added: log.added })
  }

  if (modifierSteps.length > 0) {
    steps.push(...modifierSteps)
    const arithmeticDelta = record.appliedTotal - record.modifierHistory.total
    steps.push({ kind: 'finalRolls', rolls: record.modifierHistory.modifiedRolls, arithmeticDelta })
    steps.push({ kind: 'total', value: record.appliedTotal })
  }
  return steps
}

function DiceGroup({
  unchanged,
  removed,
  added
}: {
  readonly unchanged: readonly number[]
  readonly removed: readonly number[]
  readonly added: readonly number[]
}): React.JSX.Element {
  const hasModified = removed.length > 0 || added.length > 0
  const shown = unchanged.slice(0, MAX_DICE_SHOWN)
  const truncated = unchanged.length > MAX_DICE_SHOWN

  return (
    <span className="roller-tooltip-dice-group">
      {removed.length > 0 && (
        <span className="roller-tooltip-dice roller-tooltip-dice--removed">
          {removed.join(', ')}
        </span>
      )}
      {added.length > 0 && (
        <span className="roller-tooltip-dice roller-tooltip-dice--added">{added.join(', ')}</span>
      )}
      {hasModified && shown.length > 0 && <span className="roller-tooltip-dice-sep">|</span>}
      {shown.length > 0 && (
        <span className="roller-tooltip-dice">
          {shown.join(', ')}
          {truncated ? ', …' : ''}
        </span>
      )}
    </span>
  )
}

function RollTooltip({ record }: { readonly record: RollRecord }): React.JSX.Element {
  const steps = computeSteps(record)

  return (
    <div className="roller-tooltip-inner">
      <div className="roller-tooltip-notation">{record.notation}</div>
      {record.description.length > 0 && (
        <div className="roller-tooltip-desc">{record.description.join(', ')}</div>
      )}
      <div className="roller-tooltip-divider" />
      {steps.map((step, i) => {
        if (step.kind === 'divider') {
          return <div key={`div-${i}`} className="roller-tooltip-divider" />
        }
        if (step.kind === 'arithmetic') {
          return (
            <div key={i} className="roller-tooltip-row">
              <span className="roller-tooltip-label">{step.label}</span>
              <span className="roller-tooltip-dice roller-tooltip-dice--arithmetic">
                {step.display}
              </span>
            </div>
          )
        }
        if (step.kind === 'rolls') {
          return (
            <div key={i} className="roller-tooltip-row">
              <span className="roller-tooltip-label">{step.label}</span>
              <DiceGroup unchanged={step.unchanged} removed={step.removed} added={step.added} />
            </div>
          )
        }
        if (step.kind === 'finalRolls') {
          return (
            <div key="finalRolls" className="roller-tooltip-row roller-tooltip-row--final">
              <span className="roller-tooltip-label">Final rolls</span>
              <span className="roller-tooltip-dice">
                {formatAsMath(step.rolls, step.arithmeticDelta)}
              </span>
            </div>
          )
        }
        return (
          <div key="total" className="roller-tooltip-total">
            <span>Total</span>
            <span>{step.value}</span>
          </div>
        )
      })}
    </div>
  )
}
