import { roll } from '@randsum/dice'
import type {
  AdvantageDisadvantageDH,
  RollArgumentDH,
  RollResultDH
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
  if (hope === undefined || fear === undefined || total === undefined) {
    throw new Error('Failed to roll hope and fear')
  }

  return {
    type: hope > fear ? 'hope' : 'fear',
    total: calculateTotal(total, rollingWith),
    rolls: {
      hope,
      fear,
      modifier
    }
  }
}

function calculateTotal(
  total: number,
  rollingWith: AdvantageDisadvantageDH | undefined
): number {
  if (rollingWith === 'Advantage') {
    return total + advantageDie()
  }
  if (rollingWith === 'Disadvantage') {
    return total - advantageDie()
  }
  return total
}

function advantageDie(): number {
  return roll({
    quantity: 1,
    sides: 6
  }).total
}
