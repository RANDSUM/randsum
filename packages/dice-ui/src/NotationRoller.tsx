import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import { tokenize } from '@randsum/roller/tokenize'
import type { RollRecord } from '@randsum/roller'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { traceRoll } from '@randsum/roller/trace'
import { TokenOverlayInput } from './TokenOverlayInput'
import { StepRow } from './RollSteps'
import { useTheme } from './useTheme'
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

export interface NotationRollerProps {
  readonly defaultNotation?: string
  readonly notation?: string
  readonly className?: string
  readonly onChange?: (notation: string) => void
  readonly resetToken?: number
  /** Render prop for custom actions in the description row */
  readonly renderActions?: (notation: string) => React.ReactNode
}

export function NotationRoller({
  defaultNotation = '4d6L',
  notation: controlledNotation,
  className,
  onChange,
  resetToken,
  renderActions
}: NotationRollerProps = {}): React.JSX.Element {
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
  }, [controlledNotation, resetToken])

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

  const rootClass = ['du-notation-roller', className].filter(Boolean).join(' ')

  return (
    <div
      className={rootClass}
      onClick={e => {
        if (!(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLInputElement))
          inputRef.current?.focus()
      }}
    >
      <div className={`du-notation-roller-shell du-notation-roller-shell--${shellVariant}`}>
        <div className="du-notation-roller-row">
          <div className="du-notation-roller-input-wrap">
            <div className="du-nr-input-wrap">
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
                    'du-notation-roller-input',
                    tokens.length > 0 ? 'du-notation-roller-input--highlight' : ''
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

          <div className="du-notation-roller-buttons">
            <button
              className="du-notation-roller-roll-btn"
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

        <div className="du-notation-roller-desc-row">
          {notation.length === 0 ? (
            <span className="du-notation-roller-desc du-notation-roller-desc--hint">
              Try: 4d6L, 1d20+5, 2d8!
            </span>
          ) : !isValid ? (
            <span className="du-notation-roller-desc du-notation-roller-desc--invalid">
              Invalid notation
            </span>
          ) : (
            <span className="du-notation-roller-desc du-notation-roller-desc--valid">
              {tokens
                .map((token, tokenIdx) => ({ token, tokenIdx }))
                .filter(({ token }) => Boolean(token.description))
                .map(({ token, tokenIdx }, i) => {
                  const sep =
                    i === 0
                      ? null
                      : token.category === 'Core'
                        ? token.text.startsWith('-')
                          ? ' \u2212 '
                          : ' + '
                        : ', '
                  return (
                    <Fragment key={tokenIdx}>
                      {sep !== null && (
                        <span
                          className={[
                            'du-nr-desc-sep',
                            hoveredTokenIdx !== null ? 'du-nr-desc-sep--dim' : ''
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {sep}
                        </span>
                      )}
                      <span
                        className={[
                          'du-nr-desc-chip',
                          `du-nr-desc-chip--${token.category}`,
                          hoveredTokenIdx === tokenIdx ? 'du-nr-desc-chip--active' : '',
                          hoveredTokenIdx !== null && hoveredTokenIdx !== tokenIdx
                            ? 'du-nr-desc-chip--dim'
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
          {renderActions !== undefined && renderActions(notation)}
        </div>
        {resultState && (
          <>
            <div
              className="du-notation-roller-result-backdrop"
              onClick={() => {
                setState({ status: 'idle' })
              }}
            />
            <div ref={tooltipRef} className="du-notation-roller-result-overlay">
              <div className="du-nr-tooltip-flow">
                <button
                  className="du-nr-tooltip-close"
                  onClick={() => {
                    setState({ status: 'idle' })
                  }}
                  aria-label="Close result"
                >
                  &times;
                </button>
                <div className="du-nr-tooltip-total-pane">
                  <div className="du-nr-tooltip-total-value">{resultState.total}</div>
                </div>
                <RollResultDisplay
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
  )
}

export function RollResultDisplay({
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
        <div key={`heading-${i}`} className="du-nr-tooltip-row du-nr-pool-heading">
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
    <div className="du-nr-tooltip-rows">
      {notation !== undefined && (
        <div className="du-nr-tooltip-row du-nr-tooltip-header-line">
          <span className="du-nr-tooltip-notation">{notation}</span>
          <span className="du-nr-tooltip-sep">|</span>
          <span className="du-nr-tooltip-desc">
            {records.map(r => r.description.join(', ')).join(' + ')}
          </span>
        </div>
      )}
      {steps}
      {total !== undefined && (
        <div className="du-nr-tooltip-row du-nr-tooltip-row--total">
          <span className="du-step-label du-nr-result-label--total">Total</span>
          <span className="du-step-final-math du-nr-result-dice--total">
            {records.length > 1
              ? records
                  .map((r, i) => {
                    const poolTotal =
                      r.rolls.length > 0 ? `[${r.rolls.join('+')}]` : `${r.appliedTotal}`
                    const prefix = i === 0 ? '' : r.appliedTotal < 0 ? ' - ' : ' + '
                    return `${prefix}${r.appliedTotal < 0 && i > 0 ? poolTotal.replace('-', '') : poolTotal}`
                  })
                  .join('') + ` = ${total}`
              : total}
          </span>
        </div>
      )}
    </div>
  )
}
