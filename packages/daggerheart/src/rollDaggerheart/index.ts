import { roll as coreRoll } from '@randsum/roller'
import type { DaggerheartRollArgument, DaggerheartRollResult } from '../types'
import { calculateType } from './calculateType'
import { calculateTotal } from './calculateTotal'

export function rollDaggerheart({
  modifier = 0,
  rollingWith,
  amplifyHope = false,
  amplifyFear = false
}: DaggerheartRollArgument = {}): DaggerheartRollResult {
  const hopeResult = coreRoll({
    quantity: 1,
    sides: amplifyHope ? 20 : 12,
    modifiers: { plus: modifier }
  })
  const fearResult = coreRoll({
    quantity: 1,
    sides: amplifyFear ? 20 : 12,
    modifiers: { plus: modifier }
  })
  const hope = hopeResult.total
  const fear = fearResult.total
  const total = hope + fear

  const [totalWithAdvantage, advantage] = calculateTotal(total, rollingWith)

  return {
    type: calculateType(hope, fear),
    total: totalWithAdvantage,
    rolls: {
      hope,
      advantage,
      fear,
      modifier
    }
  }
}
