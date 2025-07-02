import type { RollResult, SingleRollResult } from '../types'

export function rollType(rolls: SingleRollResult[]): RollResult['type'] {
  if (rolls.every((roll) => roll.type === 'numeric')) {
    return 'numeric'
  }

  if (rolls.every((roll) => roll.type === 'custom')) {
    return 'custom'
  }

  return 'mixed'
}
