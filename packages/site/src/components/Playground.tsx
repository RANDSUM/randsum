import React, { type FormEvent, type KeyboardEvent, useCallback, useEffect, useState } from 'react'
import {
  type DiceNotation,
  type RollerRollResult,
  type ValidValidationResult,
  roll,
  validateNotation
} from '@randsum/roller'

interface RollHistoryEntry {
  id: number
  notation: string
  result: RollerRollResult
  timestamp: Date
}

const EXAMPLE_NOTATIONS = [
  { notation: '1d20', label: '1d20', description: 'Basic d20' },
  { notation: '4d6L', label: '4d6L', description: 'Ability Score' },
  { notation: '2d20L', label: '2d20L', description: 'Advantage' },
  { notation: '2d20H', label: '2d20H', description: 'Disadvantage' },
  { notation: '3d6!', label: '3d6!', description: 'Exploding' },
  { notation: '1d20+5', label: '1d20+5', description: 'With Modifier' },
  { notation: '4d6R{1}', label: '4d6R{1}', description: 'Reroll 1s' },
  { notation: '6d6U', label: '6d6U', description: 'Unique' }
]

export default function Playground(): React.JSX.Element {
  const [notation, setNotation] = useState('4d6L')
  const [validation, setValidation] = useState<ValidValidationResult | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [rollHistory, setRollHistory] = useState<RollHistoryEntry[]>([])
  const [isRolling, setIsRolling] = useState(false)

  const validate = useCallback((input: string) => {
    if (!input.trim()) {
      setValidation(null)
      setValidationError(null)
      return
    }

    const result = validateNotation(input)
    if (result.valid) {
      setValidation(result)
      setValidationError(null)
    } else {
      setValidation(null)
      setValidationError(result.error.message)
    }
  }, [])

  const handleNotationChange = (value: string): void => {
    setNotation(value)
    validate(value)
  }

  const executeRoll = useCallback(() => {
    if (!notation.trim() || validationError) return

    setIsRolling(true)

    // Add a tiny delay for visual feedback
    setTimeout(() => {
      // Cast to DiceNotation - validation was already done
      const result = roll(notation as DiceNotation)
      if (result.error) {
        setValidationError(result.error.message)
      } else {
        const entry: RollHistoryEntry = {
          id: Date.now(),
          notation,
          result,
          timestamp: new Date()
        }
        setRollHistory(prev => [entry, ...prev].slice(0, 20)) // Keep last 20 rolls
      }
      setIsRolling(false)
    }, 100)
  }, [notation, validationError])

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    executeRoll()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      executeRoll()
    }
  }

  const selectExample = (exampleNotation: string): void => {
    setNotation(exampleNotation)
    validate(exampleNotation)
  }

  const clearHistory = (): void => {
    setRollHistory([])
  }

  // Initial validation on mount
  useEffect(() => {
    validate(notation)
  }, [])

  return (
    <div className="playground-container">
      <div className="playground-main">
        <form onSubmit={handleSubmit} className="playground-form">
          <label htmlFor="notation-input" className="form-label">
            Dice Notation
          </label>
          <div className="input-row">
            <input
              type="text"
              id="notation-input"
              value={notation}
              onChange={e => {
                handleNotationChange(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 4d6L, 2d20+5, 3d8!"
              className={`notation-input ${validationError ? 'invalid' : validation ? 'valid' : ''}`}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className={`roll-button ${isRolling ? 'rolling' : ''}`}
              disabled={!validation || isRolling}
            >
              {isRolling ? '🎲' : 'Roll'}
            </button>
          </div>

          {/* Example buttons */}
          <div className="examples-section">
            <span className="examples-label">Quick examples:</span>
            <div className="example-buttons">
              {EXAMPLE_NOTATIONS.map(example => (
                <button
                  key={example.notation}
                  type="button"
                  onClick={() => {
                    selectExample(example.notation)
                  }}
                  className={`example-btn ${notation === example.notation ? 'active' : ''}`}
                  title={example.description}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Validation Feedback */}
        <div className="validation-section">
          {validationError && (
            <div className="validation-error">
              <span className="error-icon">✗</span>
              <span>{validationError}</span>
            </div>
          )}
          {validation && !validationError && (
            <div className="validation-success">
              <span className="success-icon">✓</span>
              <div className="validation-details">
                <strong>Valid notation</strong>
                <span className="notation-description">
                  {validation.description.flat().join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Latest Roll Result */}
        {rollHistory.length > 0 && (
          <div className="latest-result">
            <div className="result-header">
              <h3>
                Latest Roll: <code>{rollHistory[0].notation}</code>
              </h3>
            </div>
            <RollResultDisplay result={rollHistory[0].result} />
          </div>
        )}
      </div>

      {/* Roll History */}
      {rollHistory.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h3>Roll History</h3>
            <button onClick={clearHistory} className="clear-history-btn">
              Clear
            </button>
          </div>
          <div className="history-list">
            {rollHistory.map((entry, index) => (
              <div key={entry.id} className={`history-item ${index === 0 ? 'latest' : ''}`}>
                <div className="history-notation">
                  <code>{entry.notation}</code>
                </div>
                <div className="history-result">
                  <span className="history-total">{entry.result.total}</span>
                  <span className="history-dice">
                    [{entry.result.rolls.flatMap(r => r.modifierHistory.modifiedRolls).join(', ')}]
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RollResultDisplay({ result }: { result: RollerRollResult }): React.JSX.Element {
  return (
    <div className="roll-result">
      <div className="result-total">
        <span className="total-label">Total</span>
        <span className="total-value">{result.total}</span>
      </div>

      {result.rolls.map((rollRecord, i) => (
        <div key={i} className="roll-record">
          <div className="roll-info">
            <div className="dice-values">
              <span className="values-label">Raw Rolls:</span>
              <div className="dice-list">
                {rollRecord.rolls.map((value, j) => (
                  <span key={j} className="die-value raw">
                    {value}
                  </span>
                ))}
              </div>
            </div>

            {rollRecord.modifierHistory.logs.length > 0 && (
              <>
                <div className="modifier-arrow">↓</div>
                <div className="dice-values modified">
                  <span className="values-label">After Modifiers:</span>
                  <div className="dice-list">
                    {rollRecord.modifierHistory.modifiedRolls.map((value, j) => {
                      const wasDropped =
                        !rollRecord.modifierHistory.modifiedRolls.includes(value) ||
                        rollRecord.modifierHistory.logs.some(
                          log => log.removed.includes(value) && !log.added.includes(value)
                        )
                      return (
                        <span key={j} className={`die-value ${wasDropped ? 'dropped' : 'kept'}`}>
                          {value}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modifier History */}
          {rollRecord.modifierHistory.logs.length > 0 && (
            <div className="modifier-history">
              <span className="history-label">Modifiers Applied:</span>
              <div className="modifier-logs">
                {rollRecord.modifierHistory.logs.map((log, j) => (
                  <div key={j} className="modifier-log">
                    <span className="modifier-name">{log.modifier}</span>
                    {log.removed.length > 0 && (
                      <span className="modifier-removed">-{log.removed.join(', ')}</span>
                    )}
                    {log.added.length > 0 && (
                      <span className="modifier-added">+{log.added.join(', ')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="roll-subtotal">
            Subtotal: <strong>{rollRecord.total}</strong>
          </div>
        </div>
      ))}
    </div>
  )
}
