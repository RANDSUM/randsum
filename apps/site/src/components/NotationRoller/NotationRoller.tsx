import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import type { RollRecord } from '@randsum/roller'
import { buildStackBlitzProject } from '../../helpers/stackblitz'
import { ErrorBoundary } from '../ErrorBoundary'
import { tokenize } from '@randsum/roller/tokenize'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { RollSteps, TokenOverlayInput, useTheme } from '@randsum/dice-ui'
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
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (tokens.length === 0 || notation.length === 0) return
      const input = inputRef.current
      if (!input) return
      const rect = input.getBoundingClientRect()
      const style = getComputedStyle(input)
      const padLeft = parseFloat(style.paddingLeft) || 0
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.font = style.font
      const chWidth = ctx.measureText('0').width
      const charIdx = Math.floor((e.clientX - rect.left - padLeft) / chWidth)
      const tokenIdx = tokens.findIndex(t => charIdx >= t.start && charIdx < t.end)
      setHoveredTokenIdx(tokenIdx === -1 ? null : tokenIdx)
    },
    [tokens, notation.length]
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredTokenIdx(null)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
                <TokenOverlayInput tokens={tokens} hoveredTokenIdx={hoveredTokenIdx} theme={theme}>
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
                        {sep !== null && <span className="nr-desc-sep">{sep}</span>}
                        <span
                          className={[
                            'nr-desc-chip',
                            `nr-desc-chip--${token.category}`,
                            hoveredTokenIdx === tokenIdx ? 'nr-desc-chip--active' : ''
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
            {notation.length > 0 && (
              <div className="nr-code-actions">
                <a
                  className="nr-code-action-btn"
                  href={`https://playground.randsum.dev?notation=${encodeURIComponent(notation)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Playground"
                  aria-label="Open this notation in the RANDSUM Playground"
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
                <div className="nr-tooltip-flow">
                  <div className="nr-tooltip-total-pane">
                    <div className="nr-tooltip-total-value">{resultState.total}</div>
                  </div>
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
        </div>
      </div>
    </ErrorBoundary>
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
          <RollSteps record={record} showHeading={multiPool} />
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
