import { roll as baseRoll, type RollResult } from '@randsum/tower'
import * as RootTypes from './types'

function interpretResult(result: number): RootTypes.Hit {
  switch (true) {
    case result >= 10:
      return RootTypes.Hit.strongHit
    case result >= 7 && result <= 9:
      return RootTypes.Hit.weakHit
    default:
      return RootTypes.Hit.miss
  }
}

function roll(bonus: number): [RootTypes.Hit, RollResult] {
  const result = baseRoll({
    quantity: 2,
    sides: 6,
    modifiers: { add: bonus }
  })

  return [interpretResult(result.result), result]
}

export const Root = { roll, interpretResult }
