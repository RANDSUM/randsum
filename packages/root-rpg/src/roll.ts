import { type NumericRollResult, roll as coreRoll } from '@randsum/roller'
import type { Result } from './types'

function interpretResult(result: number): Result {
  switch (true) {
    case result >= 10:
      return 'Strong Hit'
    case result >= 7 && result <= 9:
      return 'Weak Hit'
    default:
      return 'Miss'
  }
}

export function roll(bonus: number): [Result, NumericRollResult] {
  const args = {
    quantity: 2,
    sides: 6,
    modifiers: { plus: bonus }
  }

  const result = coreRoll(args)

  return [interpretResult(result.total), result]
}
