import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import type { RollRecord } from '@randsum/roller'
import { computeSteps, formatAsMath, buildStackBlitzProject } from '@randsum/display-utils'
import { ErrorBoundary } from '../ErrorBoundary'
import { tokenize } from '@randsum/roller/tokenize'
import './NotationRoller.css'

type RollerState =
  | { status: 'idle' }
  | { status: 'rolling' }
  | { status: 'result'; total: number; records: readonly RollRecord[] }

export function NotationRoller({
  defaultNotation = '4d6L',
  notation: controlledNotation,
  className
}: {
  readonly defaultNotation?: string
  readonly notation?: string
  readonly className?: string
} = {}): React.JSX.Element {
  const [notation, setNotation] = useState(controlledNotation ?? defaultNotation)
  const [state, setState] = useState<RollerState>({ status: 'idle' })
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null)
  const tokens = useMemo(() => tokenize(notation), [notation])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (controlledNotation === undefined) return
    setNotation(controlledNotation)
    setState({ status: 'idle' })
    setHoveredTokenIdx(null)
  }, [controlledNotation])

  // Click-outside dismiss for tooltip

  const isValid = notation.length > 0 && isDiceNotation(notation)
  const shellVariant = notation.length === 0 ? 'empty' : isValid ? 'valid' : 'invalid'
  const resultState = state.status === 'result' ? state : null

  const handleRoll = useCallback(() => {
    if (!isValid) return
    setState({ status: 'rolling' })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        const result = roll(notation)
        if (result.rolls.length === 0) {
          setState({ status: 'idle' })
          return
        }
        setState({ status: 'result', total: result.total, records: result.rolls })
      } catch {
        // invalid notation — isDiceNotation guard above should prevent this
      }
    }, 300)
  }, [notation, isValid])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotation(e.target.value)
    setState({ status: 'idle' })
    setHoveredTokenIdx(null)
  }, [])

  const rootClass = ['notation-roller', 'not-content', className].filter(Boolean).join(' ')

  return (
    <ErrorBoundary>
      <div
        className={rootClass}
        onClick={e => {
          if (!(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLInputElement))
            inputRef.current?.focus()
        }}
      >
        <div className={`notation-roller-shell notation-roller-shell--${shellVariant}`}>
          <div className="notation-roller-row">
            <div className="notation-roller-input-wrap">
              <div className="nr-input-wrap">
                {tokens.length > 0 && (
                  <div className="nr-notation-overlay" aria-hidden="true">
                    <span className="nr-first-line-spacer" />
                    {tokens.map((token, i) => (
                      <span
                        key={i}
                        className={[
                          'nr-token',
                          `nr-token--${token.type}`,
                          hoveredTokenIdx !== null && hoveredTokenIdx !== i ? 'nr-token--dim' : '',
                          hoveredTokenIdx === i ? 'nr-token--active' : ''
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {token.text}
                      </span>
                    ))}
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  className={[
                    'notation-roller-input',
                    tokens.length > 0 ? 'notation-roller-input--highlight' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  rows={1}
                  value={notation}
                  onChange={handleChange}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleRoll()
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${target.scrollHeight}px`
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  placeholder="1d20"
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="Dice notation"
                />
              </div>
            </div>

            <div className="notation-roller-buttons">
              <button
                className="notation-roller-roll-btn"
                onClick={e => {
                  e.stopPropagation()
                  handleRoll()
                }}
                disabled={!isValid || state.status === 'rolling'}
              >
                {resultState ? 'Re-Roll' : 'Roll'}
              </button>
            </div>
          </div>

          <div className="notation-roller-desc-row">
            {notation.length === 0 ? (
              <span className="notation-roller-desc notation-roller-desc--hint">
                Try: 4d6L, 1d20+5, 2d8!
              </span>
            ) : !isValid ? (
              <span className="notation-roller-desc notation-roller-desc--invalid">
                Invalid notation
              </span>
            ) : (
              <span className="notation-roller-desc notation-roller-desc--valid">
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
                        {sep !== null && <span className="nr-desc-sep">{sep}</span>}
                        <span
                          className={[
                            'nr-desc-chip',
                            `nr-desc-chip--${token.type}`,
                            hoveredTokenIdx === tokenIdx ? 'nr-desc-chip--active' : ''
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
          {resultState && (
            <>
              <div
                className="notation-roller-result-backdrop"
                onClick={() => {
                  setState({ status: 'idle' })
                }}
              />
              <div ref={tooltipRef} className="notation-roller-result-overlay">
                <button
                  className="nr-tooltip-close"
                  onClick={() => {
                    setState({ status: 'idle' })
                  }}
                  aria-label="Close result"
                >
                  &times;
                </button>
                <div className="nr-tooltip-total-pane">
                  <div className="nr-tooltip-total-value">{resultState.total}</div>
                </div>
                <div className="nr-tooltip-right">
                  <div className="nr-tooltip-header-line">
                    <span className="nr-tooltip-notation">{notation}</span>
                    <span className="nr-tooltip-sep">|</span>
                    <span className="nr-tooltip-desc">
                      {resultState.records.map(r => r.description.join(', ')).join(' + ')}
                    </span>
                  </div>
                  <RollResult records={resultState.records} total={resultState.total} />
                </div>
              </div>
            </>
          )}
          {notation.length > 0 && (
            <a
              className="notation-roller-playground-btn"
              href={`https://playground.randsum.dev?notation=${encodeURIComponent(notation)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              See in Playground
            </a>
          )}
        </div>
        {notation.length > 0 && (
          <div className="notation-roller-code-preview">
            <pre className="nr-code-block">
              <code>
                <span className="nr-code-keyword">import</span>
                {' { '}
                <span className="nr-code-fn">roll</span>
                {' } '}
                <span className="nr-code-keyword">from</span>{' '}
                <span className="nr-code-string">'@randsum/roller'</span>
                {'\n\n'}
                <span className="nr-code-keyword">const</span>
                {' result = '}
                <span className="nr-code-fn">roll</span>
                {'('}
                <span className="nr-code-string">{`'${notation}'`}</span>
                {')'}
              </code>
            </pre>
            <button
              className="nr-code-stackblitz"
              onClick={() => {
                const project = buildStackBlitzProject(notation)
                const params = new URLSearchParams({
                  title: project.title,
                  description: project.description,
                  template: project.template
                })
                for (const [name, content] of Object.entries(project.files)) {
                  params.set(`file[${name}]`, content)
                }
                window.open(
                  `https://stackblitz.com/run?${params.toString()}`,
                  '_blank',
                  'noopener,noreferrer'
                )
              }}
            >
              Edit in StackBlitz
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

const MAX_DICE_SHOWN = 10

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
    <span className="nr-result-dice-group">
      {removed.length > 0 && (
        <span className="nr-result-dice nr-result-dice--removed">{removed.join(', ')}</span>
      )}
      {added.length > 0 && (
        <span className="nr-result-dice nr-result-dice--added">{added.join(', ')}</span>
      )}
      {hasModified && shown.length > 0 && <span className="nr-result-dice-sep">|</span>}
      {shown.length > 0 && (
        <span className="nr-result-dice">
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
          return <div key={`div-${i}`} className="nr-result-divider" />
        }
        if (step.kind === 'arithmetic') {
          return (
            <div key={i} className="nr-result-row">
              <span className="nr-result-label">{step.label}</span>
              <span className="nr-result-dice nr-result-dice--arithmetic">{step.display}</span>
            </div>
          )
        }
        if (step.kind === 'rolls') {
          return (
            <div key={i} className="nr-result-row">
              <span className="nr-result-label">{step.label}</span>
              <DiceGroup unchanged={step.unchanged} removed={step.removed} added={step.added} />
            </div>
          )
        }
        return (
          <div key="finalRolls" className="nr-result-row nr-result-row--final">
            <span className="nr-result-label">Final rolls</span>
            <span className="nr-result-dice">{formatAsMath(step.rolls, step.arithmeticDelta)}</span>
          </div>
        )
      })}
    </>
  )
}

/** @internal — exported for testing only, not part of the public API */
export function RollResult({
  records,
  total
}: {
  readonly records: readonly RollRecord[]
  readonly total?: number
}): React.JSX.Element {
  const multiPool = records.length > 1

  return (
    <div className="nr-result-inner">
      {records.map((record, i) => (
        <Fragment key={i}>
          {multiPool && <div className="nr-result-pool-header">{record.notation}</div>}
          <PoolSteps record={record} />
          {multiPool && i < records.length - 1 && <div className="nr-result-pool-divider" />}
        </Fragment>
      ))}
      {total !== undefined && (
        <>
          <div className="nr-result-divider" />
          <div className="nr-result-row nr-result-row--total">
            <span className="nr-result-label nr-result-label--total">Total</span>
            <span className="nr-result-dice nr-result-dice--total">{total}</span>
          </div>
        </>
      )}
    </div>
  )
}
