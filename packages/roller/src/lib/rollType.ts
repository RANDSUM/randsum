import type { RollPoolResult, RollResult } from '../types'

export function rollType(rolls: RollPoolResult[]): RollResult['type'] {
  if (rolls.every((roll) => roll.type === 'numeric')) {
    return 'numeric'
  }

  if (rolls.every((roll) => roll.type === 'custom')) {
    return 'custom'
  }

  return 'mixed'
}
