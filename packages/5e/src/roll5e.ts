import {
  type ModifierOptions,
  type NumericRollOptions,
  type NumericRollResult,
  roll
} from '@randsum/roller'
import type { AdvantageDisadvantage5e, RollArgument5e } from './types'

export function roll5e({
  modifier,
  rollingWith
}: RollArgument5e): NumericRollResult {
  const rollArg: NumericRollOptions = {
    sides: 20,
    quantity: generateQuantity(rollingWith),
    modifiers: { ...generateModifiers(rollingWith), plus: modifier }
  }
  return roll(rollArg)
}

function generateQuantity(rollingWith?: AdvantageDisadvantage5e): 1 | 2 {
  switch (rollingWith) {
    case 'Advantage':
    case 'Disadvantage':
      return 2
    default:
      return 1
  }
}

function generateModifiers(
  rollingWith: AdvantageDisadvantage5e | undefined
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
