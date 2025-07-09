import {
  type ModifierOptions,
  type NumericRollOptions,
  type NumericRollResult,
  roll as coreRoll
} from '@randsum/roller'
import type { FifthAdvantageDisadvantage, FifthRollArgument } from './types'

export function d20Roll({
  rollingWith,
  modifier = 0
}: FifthRollArgument): NumericRollResult {
  const rollArg: NumericRollOptions = {
    sides: 20,
    quantity: generateQuantity(rollingWith),
    modifiers: { ...generateModifiers(rollingWith), plus: modifier }
  }
  return coreRoll(rollArg)
}

function generateQuantity(rollingWith?: FifthAdvantageDisadvantage): 1 | 2 {
  if (!rollingWith || (rollingWith.advantage && rollingWith.disadvantage)) {
    return 1
  }
  return 2
}

function generateModifiers(
  rollingWith: FifthAdvantageDisadvantage | undefined
): Pick<ModifierOptions, 'drop'> {
  if (!rollingWith || (rollingWith.advantage && rollingWith.disadvantage)) {
    return { drop: {} }
  }

  if (rollingWith.advantage) {
    return {
      drop: { lowest: 1 }
    }
  }
  if (rollingWith.disadvantage) {
    return {
      drop: { highest: 1 }
    }
  }

  return { drop: {} }
}
