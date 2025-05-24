import {
  type ModifierOptions,
  type NumericRollResult,
  roll
} from '@randsum/dice'
import type { AdvantageDisadvantageDH, RollArgumentDH } from './types'

export function roll5e({
  modifier,
  rollingWith
}: RollArgumentDH): NumericRollResult {
  const rollArg = {
    sides: 20,
    quantity: generateQuantity(rollingWith),
    modifiers: { ...generateModifiers(rollingWith), plus: modifier }
  }
  return roll(rollArg)
}

function generateQuantity(rollingWith?: AdvantageDisadvantageDH): 1 | 2 {
  switch (rollingWith) {
    case 'Advantage':
    case 'Disadvantage':
      return 2
    default:
      return 1
  }
}

function generateModifiers(
  rollingWith: AdvantageDisadvantageDH | undefined
): Pick<ModifierOptions, 'drop'> {
  switch (rollingWith) {
    case 'Advantage':
      return {
        drop: { lowest: 1 }
      }
    case 'Disadvantage':
      return {
        drop: { highest: 1 }
      }
    default:
      return {}
  }
}
