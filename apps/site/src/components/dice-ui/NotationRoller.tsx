import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { roll } from '@randsum/roller/roll'
import { tokenize } from '@randsum/roller/tokenize'
import { isDiceNotation } from '@randsum/roller/validate'
import { NotationDescription, checkNotation } from './NotationDescription'
import { TokenOverlayInput } from './TokenOverlayInput'
import { useTheme } from './useTheme'
import type { RollResult } from './types'
import './NotationRoller.css'

export interface NotationRollerProps {
  readonly defaultNotation?: string
  readonly notation?: string
  readonly className?: string
  readonly onChange?: (notation: string) => void
  readonly resetToken?: number
  /** Render prop for custom actions in the description row */
  readonly renderActions?: (notation: string) => React.ReactNode
  /** Set false to render the description elsewhere with NotationDescription. */
  readonly showDescription?: boolean
  /** Fires with roll result data when a roll completes. */
  readonly onRoll?: (result: RollResult) => void
}

export function NotationRoller({
  defaultNotation = '4d6L',
  notation: controlledNotation,
  className,
  onChange,
  resetToken,
  renderActions,
  showDescription = true,
  onRoll
}: NotationRollerProps = {}): React.JSX.Element {
  const theme = useTheme()
  const [notation, setNotation] = useState(controlledNotation ?? defaultNotation)
  const [rolling, setRolling] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
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
    setRolling(false)
    setHoveredTokenIdx(null)
  }, [controlledNotation, resetToken])

  const check = useMemo(() => checkNotation(notation), [notation])
  const isValid = check.kind === 'valid'
  const shellVariant = check.kind

  const handleRoll = useCallback(() => {
    if (!isValid || !isDiceNotation(notation)) return
    setRolling(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        const result = roll(notation)
        if (result.rolls.length === 0) {
          setRolling(false)
          return
        }
        onRoll?.({ total: result.total, records: result.rolls, notation })
      } catch {
        // checkNotation's trial roll above should prevent this
      }
      setRolling(false)
    }, 300)
  }, [notation, isValid, onRoll])

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
      setRolling(false)
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
              disabled={!isValid || rolling}
              aria-label="Roll the dice"
              title="Roll the dice"
            >
              Roll
            </button>
          </div>
        </div>

        {showDescription && (
          <NotationDescription
            notation={notation}
            tokens={tokens}
            check={check}
            hoveredTokenIdx={hoveredTokenIdx}
            onHoverToken={setHoveredTokenIdx}
          >
            {renderActions?.(notation)}
          </NotationDescription>
        )}
      </div>
    </div>
  )
}
