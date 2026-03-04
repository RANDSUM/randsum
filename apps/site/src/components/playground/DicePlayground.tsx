import { useCallback, useState } from 'react'
import { roll, validateNotation } from '@randsum/roller'
import { NotationInput } from './NotationInput'
import { DiceToolbar } from './DiceToolbar'
import { RollHistory } from './RollHistory'
import { NotationReference } from './NotationReference'
import { GameModePanel } from './GameModePanel'
import { useRollHistory } from './hooks/useRollHistory'
import { incrementDiceQuantity } from './helpers/incrementDiceQuantity'
import { formatResult, isFormattedError } from './helpers/formatResult'
import './playground.css'

type Mode = 'notation' | 'game'

export function DicePlayground(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('notation')
  const [notationInput, setNotationInput] = useState('')
  const { history, addRoll, clearHistory } = useRollHistory()

  const handleNotationRoll = useCallback(() => {
    const trimmed = notationInput.trim()
    if (!trimmed) return

    const validation = validateNotation(trimmed)
    if (!validation.valid) return

    const result = roll(...validation.notation)
    const formatted = formatResult(result)

    if (isFormattedError(formatted)) {
      return
    }

    addRoll({
      notation: trimmed,
      total: formatted.total,
      rolls: formatted.rolls,
      description: formatted.description
    })

    setNotationInput('')
  }, [notationInput, addRoll])

  const handleDiceClick = useCallback((sides: number) => {
    setNotationInput(prev => incrementDiceQuantity(prev, sides))
  }, [])

  const handleGameRoll = useCallback(
    (entry: {
      notation: string
      total: number
      rolls: readonly (readonly number[])[]
      description: string
    }) => {
      addRoll(entry)
    },
    [addRoll]
  )

  return (
    <div className="playground-container">
      <div className="playground-mode-toggle">
        <button
          onClick={() => {
            setMode('notation')
          }}
          className={`playground-mode-btn ${mode === 'notation' ? 'active' : ''}`}
          type="button"
        >
          Notation Mode
        </button>
        <button
          onClick={() => {
            setMode('game')
          }}
          className={`playground-mode-btn ${mode === 'game' ? 'active' : ''}`}
          type="button"
        >
          Game Mode
        </button>
      </div>

      {mode === 'notation' ? (
        <div className="playground-notation-mode">
          <div className="playground-notation-main">
            <NotationInput
              value={notationInput}
              onChange={setNotationInput}
              onSubmit={handleNotationRoll}
            />
            <DiceToolbar onDiceClick={handleDiceClick} />
            <RollHistory history={history} onClear={clearHistory} />
          </div>
          <NotationReference />
        </div>
      ) : (
        <div className="playground-game-mode">
          <GameModePanel onGameRoll={handleGameRoll} />
          <RollHistory history={history} onClear={clearHistory} />
        </div>
      )}
    </div>
  )
}
