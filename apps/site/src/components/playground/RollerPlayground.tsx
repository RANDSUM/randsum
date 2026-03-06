import { useCallback, useEffect, useRef, useState } from 'react'
import { isDiceNotation, roll } from '@randsum/roller'
import { formatBreakdown } from './helpers/formatBreakdown'
import type { RollBreakdown } from './helpers/formatBreakdown'
import './RollerPlayground.css'

type PlaygroundState =
  | { status: 'idle' }
  | { status: 'rolling' }
  | { status: 'result'; total: number; breakdown: RollBreakdown }

export function RollerPlayground(): React.JSX.Element {
  const [notation, setNotation] = useState('4d6L')
  const [state, setState] = useState<PlaygroundState>({ status: 'idle' })
  const [showTooltip, setShowTooltip] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const isValid = notation.length > 0 && isDiceNotation(notation)

  const handleRoll = useCallback(() => {
    if (!isValid) return

    setState({ status: 'rolling' })
    setShowTooltip(false)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const result = roll(notation)
      if (result.error || !result.rolls[0]) return
      setState({
        status: 'result',
        total: result.total,
        breakdown: formatBreakdown(result.rolls[0])
      })
    }, 300)
  }, [notation, isValid])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotation(e.target.value)
    setState({ status: 'idle' })
    setShowTooltip(false)
  }, [])

  const subtext = (() => {
    if (notation.length === 0) return { text: 'Try: 4d6L, 1d20+5, 2d8!', variant: 'hint' }
    if (isValid) return { text: 'Valid notation', variant: 'valid' }
    return { text: 'Invalid notation', variant: 'invalid' }
  })()

  return (
    <div className="roller-playground">
      <div className="roller-playground-row">
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
        {state.status === 'result' && (
          <div
            className="roller-playground-chip"
            onMouseEnter={() => {
              setShowTooltip(true)
            }}
            onMouseLeave={() => {
              setShowTooltip(false)
            }}
          >
            <span className="roller-playground-chip-dot" aria-hidden="true" />
            <span className="roller-playground-chip-value">{state.total}</span>
            {showTooltip && (
              <div className="roller-playground-tooltip" role="tooltip">
                <RollTooltip breakdown={state.breakdown} />
              </div>
            )}
          </div>
        )}
      </div>
      <p className={`roller-playground-subtext roller-playground-subtext--${subtext.variant}`}>
        {subtext.text}
      </p>
    </div>
  )
}

function RollTooltip({ breakdown }: { readonly breakdown: RollBreakdown }): React.JSX.Element {
  const { notation, description, rolled, kept, diceTotal, total } = breakdown
  const hasDropped = rolled.length !== kept.length
  const hasArithmetic = diceTotal !== total

  return (
    <div className="roller-tooltip-inner">
      <div className="roller-tooltip-notation">{notation}</div>
      {description.length > 0 && (
        <div className="roller-tooltip-desc">{description.join(', ')}</div>
      )}
      <div className="roller-tooltip-divider" />
      <div className="roller-tooltip-row">
        <span className="roller-tooltip-label">Rolled</span>
        <span className="roller-tooltip-dice">{rolled.join('  ')}</span>
      </div>
      {hasDropped && (
        <div className="roller-tooltip-row">
          <span className="roller-tooltip-label">Kept</span>
          <span className="roller-tooltip-dice">{kept.join('  ')}</span>
        </div>
      )}
      {hasArithmetic && (
        <div className="roller-tooltip-row">
          <span className="roller-tooltip-label">Dice</span>
          <span>{diceTotal}</span>
        </div>
      )}
      <div className="roller-tooltip-total">
        <span>Total</span>
        <span>{total}</span>
      </div>
    </div>
  )
}
