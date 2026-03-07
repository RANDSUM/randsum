import { useCallback, useEffect, useRef, useState } from 'react'
import { isDiceNotation, roll, validateNotation } from '@randsum/roller'
import type { RollRecord } from '@randsum/roller'
import './RollerPlayground.css'

type PlaygroundState =
  | { status: 'idle' }
  | { status: 'rolling' }
  | { status: 'result'; total: number; record: RollRecord }

function openInStackBlitz(notation: string): void {
  const code = `import { roll } from '@randsum/roller'

const result = roll('${notation}')

console.log('Notation:', '${notation}')
console.log('Total:   ', result.total)
console.log('Rolls:   ', result.rolls)
`
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = 'https://stackblitz.com/run'
  form.target = '_blank'

  const packageJson = JSON.stringify(
    {
      name: 'randsum-playground',
      version: '1.0.0',
      private: true,
      scripts: { start: 'tsx index.ts' },
      dependencies: { '@randsum/roller': 'latest', tsx: 'latest' }
    },
    null,
    2
  )

  const fields: Record<string, string> = {
    'project[title]': `RANDSUM — ${notation}`,
    'project[description]': `Rolling ${notation} with @randsum/roller`,
    'project[template]': 'node',
    'project[files][index.ts]': code,
    'project[files][package.json]': packageJson
  }

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

export function RollerPlayground({
  stackblitz = true,
  defaultNotation = '4d6L',
  className
}: {
  readonly stackblitz?: boolean
  readonly defaultNotation?: string
  readonly className?: string
} = {}): React.JSX.Element {
  const [notation, setNotation] = useState(defaultNotation)
  const [state, setState] = useState<PlaygroundState>({ status: 'idle' })
  const [expanded, setExpanded] = useState(false)
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
    setExpanded(false)
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
    setExpanded(false)
  }, [])

  const rootClass = ['roller-playground', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <div className={`roller-playground-shell roller-playground-shell--${shellVariant}`}>
        <div className="roller-playground-row">
          <button
            className="roller-playground-btn"
            onClick={handleRoll}
            disabled={!isValid || state.status === 'rolling'}
            aria-label={state.status === 'rolling' ? 'Rolling' : 'Roll'}
          >
            {state.status === 'rolling' ? (
              <span className="roller-playground-spinner" aria-hidden="true" />
            ) : (
              'Roll'
            )}
          </button>
          <div className="roller-playground-input-wrap">
            <input
              type="text"
              className="roller-playground-input"
              value={notation}
              onChange={handleChange}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRoll()
              }}
              placeholder="4d6L"
              spellCheck={false}
              autoComplete="off"
              aria-label="Dice notation"
            />
          </div>

          <div
            className={[
              'roller-playground-chip',
              state.status !== 'result' ? 'roller-playground-chip--empty' : '',
              state.status === 'result' && expanded ? 'roller-playground-chip--expanded' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={
              state.status === 'result'
                ? () => {
                    setExpanded(e => !e)
                  }
                : undefined
            }
            role={state.status === 'result' ? 'button' : undefined}
            tabIndex={state.status === 'result' ? 0 : undefined}
            onKeyDown={
              state.status === 'result'
                ? (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setExpanded(prev => !prev)
                    }
                  }
                : undefined
            }
            aria-label={
              state.status === 'result'
                ? expanded
                  ? 'Collapse breakdown'
                  : 'Expand breakdown'
                : undefined
            }
            aria-expanded={state.status === 'result' ? expanded : undefined}
          >
            {state.status === 'result' && (
              <>
                <span
                  className={[
                    'roller-playground-chip-value',
                    expanded ? 'roller-playground-chip-value--hidden' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {state.total}
                </span>
                {expanded ? (
                  <span className="roller-playground-chip-collapse" aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </span>
                ) : (
                  <span className="roller-playground-chip-hint" aria-hidden="true">
                    ↓
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="roller-playground-desc-row">
          <span
            className={`roller-playground-desc--${notation.length === 0 ? 'hint' : isValid ? 'valid' : 'invalid'}`}
          >
            {notationDesc(notation, isValid)}
          </span>
          {stackblitz && (
            <button
              className="roller-playground-stackblitz"
              onClick={() => {
                openInStackBlitz(notation)
              }}
              aria-label="Edit in StackBlitz"
            >
              <svg
                className="roller-playground-stackblitz-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M10 0L0 14h10L5 24 24 8h-10L19 0z" />
              </svg>
              Edit
            </button>
          )}
        </div>
        {state.status === 'result' && (
          <div
            className={`roller-playground-expand${expanded ? ' roller-playground-expand--open' : ''}`}
          >
            <div className="roller-playground-expand-inner">
              <div className="roller-playground-expand-content">
                <RollTooltip record={state.record} />
                <div className="roller-playground-expand-total">
                  <span>Total</span>
                  <span>{state.total}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function notationDesc(notation: string, isValid: boolean): string {
  if (notation.length === 0) return 'Try: 4d6L, 1d20+5, 2d8!'
  if (!isValid) return 'Invalid notation'
  const result = validateNotation(notation)
  if (!result.valid) return notation
  const lines = result.description.flat()
  return lines.length > 0 ? lines.join(', ') : notation
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
    return n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`
  })
  if (delta > 0) terms.push(`+ ${delta}`)
  if (delta < 0) terms.push(`- ${Math.abs(delta)}`)
  return terms.join(' ')
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
          {truncated ? ' …' : ''}
        </span>
      )}
    </span>
  )
}

export function RollTooltip({ record }: { readonly record: RollRecord }): React.JSX.Element {
  const steps = computeSteps(record)

  return (
    <div className="roller-tooltip-inner">
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
        return (
          <div key="finalRolls" className="roller-tooltip-row roller-tooltip-row--final">
            <span className="roller-tooltip-label">Final rolls</span>
            <span className="roller-tooltip-dice">
              {formatAsMath(step.rolls, step.arithmeticDelta)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
