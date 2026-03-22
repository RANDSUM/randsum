import type { SupportedGameId } from '../lib/gameConfig'
import { GAME_CONFIG } from '../lib/gameConfig'
import { GAME_INPUT_SPECS } from '../lib/gameInputSpecs'
import type { InputSpec } from '../lib/gameInputSpecs'

interface UseGameSpecReturn {
  readonly inputs: readonly InputSpec[]
  readonly name: string
  readonly color: string
}

export function useGameSpec(gameId: SupportedGameId): UseGameSpecReturn {
  const config = GAME_CONFIG[gameId]
  const inputs = GAME_INPUT_SPECS[gameId]

  return {
    inputs,
    name: config.name,
    color: config.color
  }
}
