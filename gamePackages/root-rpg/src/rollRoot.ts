import { type NumericRollResult, roll } from '@randsum/dice'
import type { RootResult } from './types'

function interpretResult(result: number): RootResult {
  switch (true) {
    case result >= 10:
      return 'Strong Hit'
    case result >= 7 && result <= 9:
      return 'Weak Hit'
    default:
      return 'Miss'
  }
}

export function rollRoot(bonus: number): [RootResult, NumericRollResult] {
  const args = {
    quantity: 2,
    sides: 6,
    modifiers: { plus: bonus }
  }

  const result = roll(args)

  return [interpretResult(result.total), result]
}
