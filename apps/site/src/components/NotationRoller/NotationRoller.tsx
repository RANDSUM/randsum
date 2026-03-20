import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import type { RollRecord } from '@randsum/roller'
import { buildStackBlitzProject } from '../../helpers/stackblitz'
import { ErrorBoundary } from '../ErrorBoundary'
import { tokenize } from '@randsum/roller/tokenize'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { StepRow, TokenOverlayInput, useTheme } from '@randsum/dice-ui'
import { traceRoll } from '@randsum/roller/trace'
import './NotationRoller.css'

function tokenColor(
  doc: { readonly color: string; readonly colorLight: string } | undefined,
  theme: 'light' | 'dark'
): string | undefined {
  if (!doc) return undefined
  return theme === 'light' ? doc.colorLight : doc.color
}

type RollerState =
  | { status: 'idle' }
  | { status: 'rolling' }
  | { status: 'result'; total: number; records: readonly RollRecord[] }

export function NotationRoller({
  defaultNotation = '4d6L',
  notation: controlledNotation,
  className,
  onChange,
  resetToken
}: {
  readonly defaultNotation?: string
  readonly notation?: string
  readonly className?: string
  readonly onChange?: (notation: string) => void
  readonly resetToken?: number
} = {}): React.JSX.Element {
  const theme = useTheme()
  const [notation, setNotation] = useState(controlledNotation ?? defaultNotation)
  const [state, setState] = useState<RollerState>({ status: 'idle' })
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
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
    // resetToken intentionally included: incrementing it forces re-sync even when notation hasn't changed
  }, [controlledNotation, resetToken])

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
    (e: React.MouseEvent<HTMLInputElement>) => {
      if (tokens.length === 0 || notation.length === 0) return
      const overlay = overlayRef.current
      if (!overlay) return
      const spans = Array.from(overlay.children)
      const x = e.clientX
      const matched = spans.findIndex(span => {
        const rect = span.getBoundingClientRect()
        return x >= rect.left && x < rect.right
      })
      setHoveredTokenIdx(matched === -1 ? null : matched)
    },
    [tokens, notation.length]
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredTokenIdx(null)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNotation(e.target.value)
      setState({ status: 'idle' })
      setHoveredTokenIdx(null)
      onChange?.(e.target.value)
    },
    [onChange]
  )

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
                <TokenOverlayInput
                  tokens={tokens}
                  hoveredTokenIdx={hoveredTokenIdx}
                  theme={theme}
                  overlayRef={overlayRef}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    className={[
                      'notation-roller-input',
                      tokens.length > 0 ? 'notation-roller-input--highlight' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    value={notation}
                    onChange={handleChange}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleRoll()
                      }
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    placeholder="1d20"
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Dice notation"
                  />
                </TokenOverlayInput>
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
                aria-label="Roll the dice"
                title="Roll the dice"
              >
                ROLL
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
                        : token.category === 'Core'
                          ? token.text.startsWith('-')
                            ? ' − '
                            : ' + '
                          : ', '
                    return (
                      <Fragment key={tokenIdx}>
                        {sep !== null && (
                          <span
                            className={[
                              'nr-desc-sep',
                              hoveredTokenIdx !== null ? 'nr-desc-sep--dim' : ''
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {sep}
                          </span>
                        )}
                        <span
                          className={[
                            'nr-desc-chip',
                            `nr-desc-chip--${token.category}`,
                            hoveredTokenIdx === tokenIdx ? 'nr-desc-chip--active' : '',
                            hoveredTokenIdx !== null && hoveredTokenIdx !== tokenIdx
                              ? 'nr-desc-chip--dim'
                              : ''
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={
                            {
                              '--chip-color': tokenColor(NOTATION_DOCS[token.key], theme)
                            } as React.CSSProperties
                          }
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
            <div className="nr-code-actions">
              <a
                className={`nr-code-action-btn${notation.length === 0 ? ' nr-code-action-btn--disabled' : ''}`}
                href={
                  notation.length > 0
                    ? `https://playground.randsum.dev?notation=${encodeURIComponent(notation)}`
                    : undefined
                }
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Playground"
                aria-label="Open this notation in the RANDSUM Playground"
                aria-disabled={notation.length === 0}
                onClick={
                  notation.length === 0
                    ? e => {
                        e.preventDefault()
                      }
                    : undefined
                }
              >
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
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <button
                className="nr-code-action-btn"
                title="Edit in StackBlitz"
                aria-label="Open and edit this notation in StackBlitz"
                disabled={notation.length === 0}
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
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </div>
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
                <div className="nr-tooltip-flow">
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
                  <RollResult
                    records={resultState.records}
                    total={resultState.total}
                    notation={notation}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

/** @internal — exported for testing only, not part of the public API */
export function RollResult({
  records,
  total,
  notation
}: {
  readonly records: readonly RollRecord[]
  readonly total?: number
  readonly notation?: string
}): React.JSX.Element {
  const multiPool = records.length > 1
  const steps = records.flatMap((record, i) => {
    const rows: React.JSX.Element[] = []
    if (multiPool) {
      rows.push(
        <div key={`heading-${i}`} className="nr-tooltip-row nr-pool-heading">
          {record.notation}
        </div>
      )
    }
    const traced = traceRoll(record)
    traced.forEach((step, j) => {
      rows.push(<StepRow key={`step-${i}-${j}`} step={step} />)
    })
    return rows
  })

  return (
    <div className="nr-tooltip-rows">
      {notation !== undefined && (
        <div className="nr-tooltip-row nr-tooltip-header-line">
          <span className="nr-tooltip-notation">{notation}</span>
          <span className="nr-tooltip-sep">|</span>
          <span className="nr-tooltip-desc">
            {records.map(r => r.description.join(', ')).join(' + ')}
          </span>
        </div>
      )}
      {steps}
      {total !== undefined && (
        <div className="nr-tooltip-row nr-tooltip-row--total">
          <span className="du-step-label nr-result-label--total">Total</span>
          <span className="du-step-final-math nr-result-dice--total">{total}</span>
        </div>
      )}
    </div>
  )
}
