import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isDiceNotation, roll } from '@randsum/roller'
import type { RollRecord } from '@randsum/roller'
import { ModifierReference } from '../ModifierReference'
import type { ModifierReferenceCell } from '../ModifierReference'
import { ModifierDocContent } from '../ModifierReference'
import { Overlay } from '../Overlay'
import { tokenize } from '@randsum/notation'
import './RollerPlayground.css'

type PlaygroundState =
  | { status: 'idle' }
  | { status: 'rolling' }
  | { status: 'result'; total: number; records: readonly RollRecord[] }

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
  notation: controlledNotation,
  className,
  size = 'l',
  expanded: expandedProp = false
}: {
  readonly stackblitz?: boolean
  readonly defaultNotation?: string
  readonly notation?: string
  readonly className?: string
  readonly size?: 's' | 'm' | 'l'
  readonly expanded?: boolean
} = {}): React.JSX.Element {
  type OverlayContent =
    | { kind: 'rolling' }
    | { kind: 'result' }
    | { kind: 'modifier-doc'; cell: ModifierReferenceCell; returnTo: 'result' | null }

  const [notation, setNotation] = useState(controlledNotation ?? defaultNotation)
  const [state, setState] = useState<PlaygroundState>({ status: 'idle' })
  const [expanded, setExpanded] = useState(false)
  const [overlayContent, setOverlayContent] = useState<OverlayContent | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null)
  const tokens = useMemo(() => tokenize(notation), [notation])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [])

  const dismiss = useCallback(() => {
    setDismissing(true)
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = setTimeout(() => {
      setOverlayContent(null)
      setDismissing(false)
    }, 180)
  }, [])

  useEffect(() => {
    if (controlledNotation === undefined) return
    setNotation(controlledNotation)
    setState({ status: 'idle' })
    setExpanded(false)
    setOverlayContent(null)
    setHoveredTokenIdx(null)
  }, [controlledNotation])

  const isValid = notation.length > 0 && isDiceNotation(notation)
  const shellVariant = notation.length === 0 ? 'empty' : isValid ? 'valid' : 'invalid'

  const handleRoll = useCallback(() => {
    if (!isValid) return
    setState({ status: 'rolling' })
    setOverlayContent({ kind: 'rolling' })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        const result = roll(notation)
        if (result.rolls.length === 0) {
          setState({ status: 'idle' })
          setOverlayContent(null)
          return
        }
        setState({ status: 'result', total: result.total, records: result.rolls })
        setOverlayContent({ kind: 'result' })
      } catch {
        // invalid notation — isDiceNotation guard above should prevent this
      }
    }, 300)
  }, [notation, isValid])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      if (tokens.length === 0 || notation.length === 0) return
      const input = inputRef.current
      if (!input) return
      const rect = input.getBoundingClientRect()
      const chWidth = input.offsetWidth / notation.length
      const charIdx = Math.floor((e.clientX - rect.left) / chWidth)
      const tokenIdx = tokens.findIndex(t => charIdx >= t.start && charIdx < t.end)
      setHoveredTokenIdx(tokenIdx === -1 ? null : tokenIdx)
    },
    [tokens, notation.length]
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredTokenIdx(null)
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotation(e.target.value)
    setState({ status: 'idle' })
    setExpanded(false)
    setOverlayContent(null)
    setHoveredTokenIdx(null)
  }, [])

  const handleCellClick = useCallback(
    (cell: ModifierReferenceCell) => {
      if (overlayContent?.kind === 'result') {
        setOverlayContent({ kind: 'modifier-doc', cell, returnTo: 'result' })
      } else if (!overlayContent) {
        setOverlayContent({ kind: 'modifier-doc', cell, returnTo: null })
      }
      // If rolling or already showing a doc, do nothing
    },
    [overlayContent]
  )

  const handleAddModifier = useCallback((insertNotation: string) => {
    setNotation(prev => prev + insertNotation)
    setOverlayContent(null)
    inputRef.current?.focus()
  }, [])

  const notationHasCore = /\d+[Dd]\d+/.test(notation)

  const rootClass = [
    'roller-playground',
    `roller-playground--size-${size}`,
    'not-content',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={rootClass}
      onClick={e => {
        if (!(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLInputElement))
          inputRef.current?.focus()
        const expandEl = (e.currentTarget as HTMLElement).querySelector('.roller-playground-expand')
        if (overlayContent !== null && expandEl && !expandEl.contains(e.target as Node)) {
          dismiss()
        }
      }}
    >
      <div className={`roller-playground-shell roller-playground-shell--${shellVariant}`}>
        <div className="roller-playground-row">
          <div className="roller-playground-code-wrap">
            <span className="roller-playground-code-prefix">
              <button
                className="roller-playground-code-fn"
                onClick={e => {
                  e.stopPropagation()
                  handleRoll()
                }}
                disabled={!isValid || state.status === 'rolling'}
                aria-label="Roll"
              >
                roll
              </button>
              <span className="roller-playground-code-paren">(</span>
              <span className="roller-playground-code-str-delim">&#39;</span>
            </span>
            <div className="rp-input-wrap">
              {tokens.length > 0 && (
                <div className="rp-notation-overlay" aria-hidden="true">
                  {tokens.map((token, i) => (
                    <span
                      key={i}
                      className={[
                        'rp-token',
                        `rp-token--${token.type}`,
                        hoveredTokenIdx !== null && hoveredTokenIdx !== i ? 'rp-token--dim' : '',
                        hoveredTokenIdx === i ? 'rp-token--active' : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {token.text}
                    </span>
                  ))}
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                className={[
                  'roller-playground-input',
                  tokens.length > 0 ? 'roller-playground-input--highlight' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ width: `${notation.length || 4}ch` }}
                value={notation}
                onChange={handleChange}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRoll()
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                placeholder="1d20"
                spellCheck={false}
                autoComplete="off"
                aria-label="Dice notation"
              />
            </div>
            <span
              className="roller-playground-code-suffix"
              onClick={e => {
                e.stopPropagation()
                const input = inputRef.current
                if (input) {
                  input.focus()
                  const len = input.value.length
                  input.setSelectionRange(len, len)
                }
              }}
              style={{ cursor: 'text' }}
            >
              <span className="roller-playground-code-str-delim">&#39;</span>
              <span className="roller-playground-code-paren">)</span>
            </span>
          </div>

          {!expandedProp && (
            <div
              className={[
                'roller-playground-chip',
                state.status !== 'result' ? 'roller-playground-chip--modifiers' : '',
                (state.status === 'result' ? overlayContent !== null : expanded)
                  ? 'roller-playground-chip--expanded'
                  : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={
                state.status === 'rolling'
                  ? undefined
                  : () => {
                      if (state.status === 'result') {
                        if (overlayContent) {
                          setOverlayContent(null)
                        } else {
                          setOverlayContent({ kind: 'result' })
                        }
                      } else {
                        setExpanded(v => !v)
                      }
                    }
              }
              role="button"
              tabIndex={state.status === 'rolling' ? undefined : 0}
              onKeyDown={
                state.status === 'rolling'
                  ? undefined
                  : (e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (state.status === 'result') {
                          if (overlayContent) {
                            setOverlayContent(null)
                          } else {
                            setOverlayContent({ kind: 'result' })
                          }
                        } else {
                          setExpanded(prev => !prev)
                        }
                      }
                    }
              }
              aria-label={
                state.status === 'result'
                  ? overlayContent !== null
                    ? 'Close result'
                    : 'Open result'
                  : expanded
                    ? 'Close modifier reference'
                    : 'Open modifier reference'
              }
              aria-expanded={state.status === 'result' ? overlayContent !== null : expanded}
            >
              {state.status === 'result' ? (
                <>
                  <span
                    className={[
                      'roller-playground-chip-value',
                      overlayContent !== null ? 'roller-playground-chip-value--hidden' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {state.total}
                  </span>
                  {overlayContent !== null ? (
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
              ) : expanded ? (
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
                <span className="roller-playground-chip-modifiers-label">Modifiers</span>
              )}
            </div>
          )}
        </div>
        <div className="roller-playground-desc-row">
          {notation.length === 0 ? (
            <span className="roller-playground-desc roller-playground-desc--hint">
              Try: 4d6L, 1d20+5, 2d8!
            </span>
          ) : !isValid ? (
            <span className="roller-playground-desc roller-playground-desc--invalid">
              Invalid notation
            </span>
          ) : (
            <span className="roller-playground-desc roller-playground-desc--valid">
              {tokens
                .map((token, tokenIdx) => ({ token, tokenIdx }))
                .filter(({ token }) => Boolean(token.description))
                .map(({ token, tokenIdx }, i) => {
                  const sep =
                    i === 0
                      ? null
                      : token.type === 'core'
                        ? token.text.startsWith('-')
                          ? ' − '
                          : ' + '
                        : ', '
                  return (
                    <Fragment key={tokenIdx}>
                      {sep !== null && <span className="rp-desc-sep">{sep}</span>}
                      <span
                        className={[
                          'rp-desc-chip',
                          `rp-desc-chip--${token.type}`,
                          hoveredTokenIdx === tokenIdx ? 'rp-desc-chip--active' : ''
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onMouseEnter={() => {
                          setHoveredTokenIdx(tokenIdx)
                        }}
                        onMouseLeave={() => {
                          setHoveredTokenIdx(null)
                        }}
                      >
                        {token.description}
                      </span>
                    </Fragment>
                  )
                })}
            </span>
          )}
        </div>
        <div
          className={`roller-playground-expand${expandedProp || expanded || overlayContent !== null ? ' roller-playground-expand--open' : ''}`}
        >
          <div className="roller-playground-expand-inner">
            <div className="roller-playground-expand-reference">
              <ModifierReference modifiersDisabled={!isValid} onCellClick={handleCellClick} />
              <Overlay
                visible={overlayContent !== null}
                dismissing={dismissing}
                dismissible={
                  overlayContent?.kind === 'result' ||
                  (overlayContent?.kind === 'modifier-doc' && overlayContent.returnTo === null)
                }
                onDismiss={
                  overlayContent?.kind === 'modifier-doc' && overlayContent.returnTo === 'result'
                    ? () => {
                        setOverlayContent({ kind: 'result' })
                      }
                    : dismiss
                }
              >
                {overlayContent?.kind === 'rolling' && (
                  <div className="roller-playground-result-loading">
                    <div className="roller-playground-expand-loading-spinner" />
                  </div>
                )}
                {overlayContent?.kind === 'result' && state.status === 'result' && (
                  <>
                    <div className="roller-playground-result-total-hero">{state.total}</div>
                    <RollResult records={state.records} />
                    <div className="roller-playground-expand-total">
                      <span>Total</span>
                      <span className="roller-playground-expand-total-chip">{state.total}</span>
                    </div>
                  </>
                )}
                {overlayContent?.kind === 'modifier-doc' &&
                  (overlayContent.returnTo === 'result' ? (
                    <ModifierDocContent
                      cell={overlayContent.cell}
                      onBack={() => {
                        setOverlayContent({ kind: 'result' })
                      }}
                      onAdd={handleAddModifier}
                      notationHasCore={notationHasCore}
                    />
                  ) : (
                    <ModifierDocContent
                      cell={overlayContent.cell}
                      onAdd={handleAddModifier}
                      notationHasCore={notationHasCore}
                    />
                  ))}
              </Overlay>
            </div>
          </div>
        </div>
        {stackblitz && (
          <button
            className="roller-playground-stackblitz roller-playground-stackblitz--corner"
            onClick={() => {
              openInStackBlitz(notation)
            }}
            aria-label="Open in StackBlitz"
          >
            <svg
              className="roller-playground-stackblitz-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M10 0L0 14h10L5 24 24 8h-10L19 0z" />
            </svg>
            Edit in StackBlitz
          </button>
        )}
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

function numVal(opts: Record<string, unknown>, key: string): number | undefined {
  const v = opts[key]
  return typeof v === 'number' ? v : undefined
}

function formatComparison(opts: Record<string, unknown>): string {
  const parts: string[] = []
  const gt = numVal(opts, 'greaterThan')
  if (gt !== undefined) parts.push(`Greater than ${gt}`)
  const gte = numVal(opts, 'greaterThanOrEqual')
  if (gte !== undefined) parts.push(`At least ${gte}`)
  const lt = numVal(opts, 'lessThan')
  if (lt !== undefined) parts.push(`Less than ${lt}`)
  const lte = numVal(opts, 'lessThanOrEqual')
  if (lte !== undefined) parts.push(`At most ${lte}`)
  const exact = numVal(opts, 'exact')
  if (exact !== undefined) parts.push(`${exact}`)
  return parts.join(', ')
}

function modifierLabel(modifier: string, options: unknown): string {
  const base = modifier.charAt(0).toUpperCase() + modifier.slice(1)
  if (options !== null && typeof options === 'object') {
    const opts = options as Record<string, unknown>
    if (modifier === 'drop' || modifier === 'keep') {
      const lowest = numVal(opts, 'lowest')
      const highest = numVal(opts, 'highest')
      const parts: string[] = []
      if (lowest !== undefined) parts.push(`Lowest ${lowest}`)
      if (highest !== undefined) parts.push(`Highest ${highest}`)
      if (parts.length > 0) return `${base} ${parts.join(', ')}`
    }
    const comparison = formatComparison(opts)
    if (comparison) return `${base} ${comparison}`
  }
  return base
}

function applyRemove(pool: number[], values: readonly number[]): number[] {
  const result = [...pool]
  for (const val of values) {
    const idx = result.indexOf(val)
    if (idx !== -1) result.splice(idx, 1)
  }
  return result
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

    const isSplittable =
      (log.modifier === 'drop' || log.modifier === 'keep') && typeof log.options === 'object'

    if (isSplittable) {
      const opts = log.options as Record<string, unknown>
      const lowest = numVal(opts, 'lowest')
      const highest = numVal(opts, 'highest')
      const base = log.modifier.charAt(0).toUpperCase() + log.modifier.slice(1)

      if (lowest !== undefined && highest !== undefined) {
        // Split into two rows: lowest first, then highest
        const sortedAsc = [...current].sort((a, b) => a - b)
        const lowestRemoved = sortedAsc.slice(0, lowest)
        const afterLowest = applyRemove(current, lowestRemoved)

        const sortedDesc = [...afterLowest].sort((a, b) => b - a)
        const highestRemoved = sortedDesc.slice(0, highest)
        const afterHighest = applyRemove(afterLowest, highestRemoved)

        modifierSteps.push({
          kind: 'rolls',
          label: `${base} Lowest ${lowest}`,
          unchanged: afterLowest,
          removed: lowestRemoved,
          added: []
        })
        modifierSteps.push({
          kind: 'rolls',
          label: `${base} Highest ${highest}`,
          unchanged: afterHighest,
          removed: highestRemoved,
          added: []
        })

        current.length = 0
        current.push(...afterHighest)
        continue
      }
    }

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

    const label = modifierLabel(log.modifier, log.options)
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
    <span className="roller-result-dice-group">
      {removed.length > 0 && (
        <span className="roller-result-dice roller-result-dice--removed">{removed.join(', ')}</span>
      )}
      {added.length > 0 && (
        <span className="roller-result-dice roller-result-dice--added">{added.join(', ')}</span>
      )}
      {hasModified && shown.length > 0 && <span className="roller-result-dice-sep">|</span>}
      {shown.length > 0 && (
        <span className="roller-result-dice">
          {shown.join(', ')}
          {truncated ? ' …' : ''}
        </span>
      )}
    </span>
  )
}

function PoolSteps({ record }: { readonly record: RollRecord }): React.JSX.Element {
  const steps = computeSteps(record)
  return (
    <>
      {steps.map((step, i) => {
        if (step.kind === 'divider') {
          return <div key={`div-${i}`} className="roller-result-divider" />
        }
        if (step.kind === 'arithmetic') {
          return (
            <div key={i} className="roller-result-row">
              <span className="roller-result-label">{step.label}</span>
              <span className="roller-result-dice roller-result-dice--arithmetic">
                {step.display}
              </span>
            </div>
          )
        }
        if (step.kind === 'rolls') {
          return (
            <div key={i} className="roller-result-row">
              <span className="roller-result-label">{step.label}</span>
              <DiceGroup unchanged={step.unchanged} removed={step.removed} added={step.added} />
            </div>
          )
        }
        return (
          <div key="finalRolls" className="roller-result-row roller-result-row--final">
            <span className="roller-result-label">Final rolls</span>
            <span className="roller-result-dice">
              {formatAsMath(step.rolls, step.arithmeticDelta)}
            </span>
          </div>
        )
      })}
    </>
  )
}

export function RollResult({
  records
}: {
  readonly records: readonly RollRecord[]
}): React.JSX.Element {
  const multiPool = records.length > 1

  return (
    <div className="roller-result-inner">
      {records.map((record, i) => (
        <Fragment key={i}>
          {multiPool && <div className="roller-result-pool-header">{record.notation}</div>}
          <PoolSteps record={record} />
          {multiPool && i < records.length - 1 && <div className="roller-result-pool-divider" />}
        </Fragment>
      ))}
    </div>
  )
}
