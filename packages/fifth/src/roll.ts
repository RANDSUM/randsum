import {
  type ModifierOptions,
  type NumericRollOptions,
  type NumericRollResult,
  roll as coreRoll
} from '@randsum/roller'
import type { AdvantageDisadvantage, RollArgument } from './types'

export function roll({
  modifier,
  rollingWith
}: RollArgument): NumericRollResult {
  const rollArg: NumericRollOptions = {
    sides: 20,
    quantity: generateQuantity(rollingWith),
    modifiers: { ...generateModifiers(rollingWith), plus: modifier }
  }
  return coreRoll(rollArg)
}

function generateQuantity(rollingWith?: AdvantageDisadvantage): 1 | 2 {
  switch (rollingWith) {
    case 'Advantage':
    case 'Disadvantage':
      return 2
    default:
      return 1
  }
}

function generateModifiers(
  rollingWith: AdvantageDisadvantage | undefined
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
      return { drop: {} }
  }
}
