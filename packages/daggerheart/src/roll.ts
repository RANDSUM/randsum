import { roll as coreRoll } from '@randsum/roller'
import type {
  AdvantageDisadvantage,
  RollArgument,
  RollResult,
  RollResultType
} from './types'

export function roll({
  modifier = 0,
  rollingWith,
  amplifyHope = false,
  amplifyFear = false
}: RollArgument): RollResult {
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

function calculateType(hope: number, fear: number): RollResultType {
  if (hope === fear) {
    return 'critical hope'
  }
  if (hope > fear) {
    return 'hope'
  }
  return 'fear'
}

function calculateTotal(
  total: number,
  rollingWith: AdvantageDisadvantage | undefined
): [number, number | undefined] {
  if (rollingWith) {
    const advantage = advantageDie()
    if (rollingWith === 'Advantage') {
      return [total + advantage, advantage]
    }
    return [total - advantage, -advantage]
  }
  return [total, undefined]
}

function advantageDie(): number {
  return coreRoll({
    quantity: 1,
    sides: 6
  }).total
}
