import { useCallback, useEffect, useRef, useState } from 'react'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import { NotationDescription, NotationRoller, RollResultDisplay } from '../dice-ui'
import type { RollResult } from '../dice-ui'
import { addDie, adjustConstant, toggleModifier } from './notationEdits'
import './RollerApp.css'

interface HistoryEntry {
  readonly id: number
  readonly notation: string
  readonly total: number
  readonly description: string
}

const HISTORY_KEY = 'randsum-app-history'
const HISTORY_LIMIT = 50
const DICE = [4, 6, 8, 10, 12, 20, 100] as const

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry: Record<string, unknown> = { ...value }
  return (
    typeof entry.id === 'number' &&
    typeof entry.notation === 'string' &&
    typeof entry.total === 'number' &&
    typeof entry.description === 'string'
  )
}

function loadHistory(): readonly HistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : []
  } catch {
    return []
  }
}

function saveHistory(history: readonly HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // Private mode or a full quota: history just doesn't persist
  }
}

export function RollerApp(): React.JSX.Element {
  const [notation, setNotation] = useState('1d20')
  const [result, setResult] = useState<RollResult | undefined>(undefined)
  const [history, setHistory] = useState<readonly HistoryEntry[]>([])
  const historyRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const record = useCallback((next: RollResult) => {
    setResult(next)
    navigator.vibrate?.(12)
    setHistory(previous => {
      const entry: HistoryEntry = {
        id: Date.now(),
        notation: next.notation,
        total: next.total,
        description: next.records.map(r => r.description.join(', ')).join(' + ')
      }
      const updated = [entry, ...previous].slice(0, HISTORY_LIMIT)
      saveHistory(updated)
      return updated
    })
  }, [])

  const rollAgain = useCallback(
    (again: string) => {
      setNotation(again)
      // A stored roll that no longer parses just loads into the input
      if (!isDiceNotation(again)) return
      const rolled = roll(again)
      record({ total: rolled.total, records: rolled.rolls, notation: again })
    },
    [record]
  )

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  return (
    <div className="ra-app">
      <section className="ra-stage" aria-label="Result">
        {result === undefined ? (
          <div className="ra-empty">
            <p className="ra-empty-title">Pick some dice, or type any roll.</p>
            <p className="ra-empty-hint">
              Tap a die to add it, then roll. Try <code>4d6L</code> or <code>2d20L+5</code>.
            </p>
          </div>
        ) : (
          <div className="ra-result" key={history[0]?.id}>
            <p className="ra-total" aria-live="polite">
              {result.total}
            </p>
            <div className="ra-steps">
              <RollResultDisplay records={result.records} notation={result.notation} />
            </div>
          </div>
        )}
      </section>

      <section className="ra-dock" aria-label="Build a roll">
        <NotationDescription className="ra-description" notation={notation} />
        <div className="ra-pad" role="group" aria-label="Add a die">
          {DICE.map(sides => (
            <button
              key={sides}
              type="button"
              className="ra-key ra-key--die"
              onClick={() => {
                setNotation(current => addDie(current, sides))
              }}
            >
              d{sides}
            </button>
          ))}
          <button
            type="button"
            className="ra-key"
            onClick={() => {
              setNotation('')
            }}
          >
            Clear
          </button>
        </div>
        <div className="ra-pad ra-pad--mods" role="group" aria-label="Modify the roll">
          <button
            type="button"
            className="ra-key"
            aria-label="Subtract one"
            onClick={() => {
              setNotation(current => adjustConstant(current, -1))
            }}
          >
            −1
          </button>
          <button
            type="button"
            className="ra-key"
            aria-label="Add one"
            onClick={() => {
              setNotation(current => adjustConstant(current, 1))
            }}
          >
            +1
          </button>
          <button
            type="button"
            className="ra-key"
            onClick={() => {
              setNotation(current => toggleModifier(current, 'L'))
            }}
          >
            Drop low
          </button>
          <button
            type="button"
            className="ra-key"
            onClick={() => {
              setNotation(current => toggleModifier(current, 'H'))
            }}
          >
            Drop high
          </button>
          <button
            type="button"
            className="ra-key"
            onClick={() => {
              setNotation(current => toggleModifier(current, '!'))
            }}
          >
            Explode
          </button>
        </div>
        <NotationRoller
          className="ra-roller"
          notation={notation}
          showDescription={false}
          inputActions={
            <button
              type="button"
              className="ra-history-link"
              aria-haspopup="dialog"
              onClick={() => {
                historyRef.current?.showModal()
                // Start on Done, not Clear, so a stray Enter can't wipe history
                historyRef.current?.querySelector<HTMLButtonElement>('.ra-history-close')?.focus()
              }}
            >
              History
            </button>
          }
          onChange={setNotation}
          onRoll={record}
        />
      </section>
      <dialog
        ref={historyRef}
        className="ra-history"
        aria-labelledby="ra-history-title"
        onClick={event => {
          // A click on the backdrop lands on the dialog itself
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <div className="ra-history-head">
          <h2 id="ra-history-title">History</h2>
          <div className="ra-history-actions">
            {history.length > 0 && (
              <button type="button" className="ra-text-button" onClick={clearHistory}>
                Clear
              </button>
            )}
            <button
              type="button"
              className="ra-text-button ra-history-close"
              onClick={() => {
                historyRef.current?.close()
              }}
            >
              Done
            </button>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="ra-history-hint">Your rolls land here. Tap one to roll it again.</p>
        ) : (
          <ol>
            {history.map(entry => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="ra-history-item"
                  onClick={() => {
                    historyRef.current?.close()
                    rollAgain(entry.notation)
                  }}
                  aria-label={`Roll ${entry.notation} again (last total ${entry.total})`}
                >
                  <span className="ra-history-notation">{entry.notation}</span>
                  <span className="ra-history-desc">{entry.description}</span>
                  <span className="ra-history-total">{entry.total}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </dialog>
    </div>
  )
}
