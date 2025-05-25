import { roll } from '@randsum/dice'
import type {
  AdvantageDisadvantageDH,
  RollArgumentDH,
  RollResultDH,
  RollResultDHType
} from './types'

export function rollDH({
  modifier = 0,
  rollingWith
}: RollArgumentDH): RollResultDH {
  const arg = {
    quantity: 2,
    sides: 12,
    modifiers: { plus: modifier }
  }
  const {
    result: [hope, fear],
    total
  } = roll(arg)
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

function calculateType(hope: number, fear: number): RollResultDHType {
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
  rollingWith: AdvantageDisadvantageDH | undefined
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
  return roll({
    quantity: 1,
    sides: 6
  }).total
}
