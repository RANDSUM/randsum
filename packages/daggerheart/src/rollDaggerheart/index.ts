import { roll as coreRoll } from '@randsum/roller'
import type { DaggerheartGameResult, DaggerheartRollArgument } from '../types'
import { calculateType } from './calculateType'
import { calculateTotal } from './calculateTotal'

export function rollDaggerheart({
  modifier = 0,
  rollingWith,
  amplifyHope = false,
  amplifyFear = false
}: DaggerheartRollArgument = {}): DaggerheartGameResult {
  const hopeResult = coreRoll({
    sides: amplifyHope ? 20 : 12
  })
  const fearResult = coreRoll({
    sides: amplifyFear ? 20 : 12
  })
  const hope = hopeResult.total
  const fear = fearResult.total
  const [result, advantage] = calculateTotal(
    hope + fear + modifier,
    rollingWith
  )

  return {
    rolls: [hopeResult, fearResult],
    result: {
      total: result,
      type: calculateType(hope, fear),
      details: {
        amplifyHope,
        amplifyFear,
        hope,
        advantage,
        fear,
        modifier
      }
    }
  }
}
