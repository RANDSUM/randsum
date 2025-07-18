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
    quantity: 1,
    sides: amplifyHope ? 20 : 12
  })
  const fearResult = coreRoll({
    quantity: 1,
    sides: amplifyFear ? 20 : 12
  })
  const hope = hopeResult.total
  const fear = fearResult.total
  const total = hope + fear + modifier

  const [totalWithAdvantage, advantage] = calculateTotal(total, rollingWith)

  return {
    result: totalWithAdvantage,
    type: calculateType(hope, fear),
    baseResult: {
      total: totalWithAdvantage,
      rolls: {
        hope,
        advantage,
        fear,
        modifier
      }
    }
  }
}
