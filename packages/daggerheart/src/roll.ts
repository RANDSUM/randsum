import { type NumericRollOptions, roll as coreRoll } from '@randsum/roller'
import type {
  AdvantageDisadvantage,
  RollArgument,
  RollResult,
  RollResultType
} from './types'

function rollArg({
  modifier = 0,
  amplifyHope = false,
  amplifyFear = false
}: RollArgument): NumericRollOptions[] {
  if (amplifyHope && amplifyFear) {
    return [
      {
        quantity: 2,
        sides: 20,
        modifiers: { plus: modifier }
      }
    ]
  }
  if (amplifyHope) {
    return [
      {
        quantity: 1,
        sides: 20,
        modifiers: { plus: modifier }
      },
      {
        quantity: 1,
        sides: 12,
        modifiers: { plus: modifier }
      }
    ]
  }
  if (amplifyFear) {
    return [
      {
        quantity: 1,
        sides: 12,
        modifiers: { plus: modifier }
      },
      {
        quantity: 1,
        sides: 12,
        modifiers: { plus: modifier }
      }
    ]
  }
  return [
    {
      quantity: 2,
      sides: 12,
      modifiers: { plus: modifier }
    }
  ]
}

export function roll({
  modifier = 0,
  rollingWith,
  amplifyHope = false,
  amplifyFear = false
}: RollArgument): RollResult {
  const {
    rawResults: [hope, fear],
    total
  } = coreRoll(...rollArg({ modifier, amplifyHope, amplifyFear }))
  if (hope === undefined || fear === undefined) {
    throw new Error('Failed to roll hope and fear')
  }

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
