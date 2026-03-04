import { useCallback, useState } from 'react'
import { GAME_CONFIGS } from './gameConfigs'
import type { FieldConfig, GameConfig } from './gameConfigs'

interface GameModePanelProps {
  readonly onGameRoll: (entry: {
    notation: string
    total: number
    rolls: readonly (readonly number[])[]
    description: string
  }) => void
}

type FieldValues = Record<string, string | number | boolean>

function getDefaultValues(config: GameConfig): FieldValues {
  const values: FieldValues = {}
  for (const field of config.fields) {
    values[field.name] = field.defaultValue
  }
  return values
}

async function executeGameRoll(
  gameId: string,
  values: FieldValues
): Promise<{
  notation: string
  total: number
  rolls: readonly (readonly number[])[]
  description: string
}> {
  switch (gameId) {
    case 'fifth': {
      const mod = await import('@randsum/fifth')
      const rollingWithValue = values.rollingWith as string
      const rollingWith =
        rollingWithValue === 'Advantage'
          ? { advantage: true }
          : rollingWithValue === 'Disadvantage'
            ? { disadvantage: true }
            : undefined
      const result = mod.roll({
        modifier: Number(values.modifier),
        rollingWith
      })
      return {
        notation: `D&D 5e (mod: ${values.modifier}, ${rollingWithValue})`,
        total: typeof result.result === 'number' ? result.result : result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `D&D 5e: ${result.result}`
      }
    }

    case 'blades': {
      const mod = await import('@randsum/blades')
      const result = mod.roll(Number(values.diceCount))
      return {
        notation: `Blades (${values.diceCount}d)`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `Blades: ${result.result}`
      }
    }

    case 'daggerheart': {
      const mod = await import('@randsum/daggerheart')
      const rollingWithDH = values.rollingWith as string
      const result = mod.roll({
        modifier: Number(values.modifier),
        rollingWith:
          rollingWithDH === 'Normal' ? undefined : (rollingWithDH as 'Advantage' | 'Disadvantage'),
        amplifyHope: Boolean(values.amplifyHope),
        amplifyFear: Boolean(values.amplifyFear)
      })
      return {
        notation: `Daggerheart (mod: ${values.modifier})`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `Daggerheart: ${JSON.stringify(result.result)} (total: ${result.total})`
      }
    }

    case 'pbta': {
      const mod = await import('@randsum/pbta')
      const result = mod.roll({
        stat: Number(values.stat),
        forward: Number(values.forward),
        ongoing: Number(values.ongoing),
        advantage: Boolean(values.advantage),
        disadvantage: Boolean(values.disadvantage)
      })
      return {
        notation: `PbtA (stat: ${values.stat})`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `PbtA: ${result.result}`
      }
    }

    case 'root-rpg': {
      const mod = await import('@randsum/root-rpg')
      const result = mod.roll(Number(values.bonus))
      return {
        notation: `Root RPG (bonus: ${values.bonus})`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `Root RPG: ${result.result}`
      }
    }

    case 'salvageunion': {
      const mod = await import('@randsum/salvageunion')
      const tableName = values.tableName as string | undefined
      const result = mod.roll(tableName)
      return {
        notation: `Salvage Union (${tableName ?? 'Core Mechanic'})`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `Salvage Union: ${JSON.stringify(result.result)}`
      }
    }

    default:
      throw new Error(`Unknown game: ${gameId}`)
  }
}

export function GameModePanel({ onGameRoll }: GameModePanelProps): React.JSX.Element {
  const [selectedGameId, setSelectedGameId] = useState(GAME_CONFIGS[0].id)
  const [fieldValues, setFieldValues] = useState<FieldValues>(getDefaultValues(GAME_CONFIGS[0]))
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedGame = GAME_CONFIGS.find(g => g.id === selectedGameId) ?? GAME_CONFIGS[0]

  const handleGameChange = useCallback((gameId: string) => {
    const game = GAME_CONFIGS.find(g => g.id === gameId)
    if (game) {
      setSelectedGameId(gameId)
      setFieldValues(getDefaultValues(game))
      setLastResult(null)
      setError(null)
    }
  }, [])

  const handleFieldChange = useCallback((fieldName: string, value: string | number | boolean) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }))
  }, [])

  const handleRoll = useCallback(async () => {
    setIsRolling(true)
    setError(null)
    try {
      const result = await executeGameRoll(selectedGameId, fieldValues)
      setLastResult(result.description)
      onGameRoll(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsRolling(false)
    }
  }, [selectedGameId, fieldValues, onGameRoll])

  return (
    <div className="playground-game-panel">
      <div className="playground-game-selector">
        <label htmlFor="game-select">Game System</label>
        <select
          id="game-select"
          value={selectedGameId}
          onChange={e => {
            handleGameChange(e.target.value)
          }}
          className="playground-select"
        >
          {GAME_CONFIGS.map(game => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </div>

      <div className="playground-game-fields">
        {selectedGame.fields.map(field => (
          <GameField
            key={field.name}
            field={field}
            value={fieldValues[field.name]}
            onChange={value => {
              handleFieldChange(field.name, value)
            }}
          />
        ))}
      </div>

      <button
        onClick={() => {
          void handleRoll()
        }}
        disabled={isRolling}
        className="playground-game-roll-btn"
        style={{ borderColor: selectedGame.color }}
        type="button"
      >
        {isRolling ? 'Rolling...' : `Roll ${selectedGame.name}`}
      </button>

      {error && <p className="playground-validation-error">{error}</p>}

      {lastResult && (
        <div className="playground-game-result" style={{ borderLeftColor: selectedGame.color }}>
          <strong>Result:</strong> {lastResult}
        </div>
      )}
    </div>
  )
}

function GameField({
  field,
  value,
  onChange
}: {
  readonly field: FieldConfig
  readonly value: string | number | boolean
  readonly onChange: (value: string | number | boolean) => void
}): React.JSX.Element {
  switch (field.type) {
    case 'number':
      return (
        <div className="playground-field">
          <label htmlFor={`field-${field.name}`}>{field.label}</label>
          <input
            id={`field-${field.name}`}
            type="number"
            value={Number(value)}
            min={field.min}
            max={field.max}
            onChange={e => {
              onChange(Number(e.target.value))
            }}
            className="playground-number-input"
          />
        </div>
      )

    case 'select':
      return (
        <div className="playground-field">
          <label htmlFor={`field-${field.name}`}>{field.label}</label>
          <select
            id={`field-${field.name}`}
            value={String(value)}
            onChange={e => {
              onChange(e.target.value)
            }}
            className="playground-select"
          >
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )

    case 'boolean':
      return (
        <div className="playground-field playground-field-checkbox">
          <label htmlFor={`field-${field.name}`}>
            <input
              id={`field-${field.name}`}
              type="checkbox"
              checked={Boolean(value)}
              onChange={e => {
                onChange(e.target.checked)
              }}
            />
            {field.label}
          </label>
        </div>
      )
  }
}
