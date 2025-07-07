import type { RollParams, RollResult } from '../../types'
import { coreSpreadRolls, isNumericRollOptions } from '../../lib'

export function generateInitialRolls({
  options
}: RollParams): RollResult['history']['initialRolls'] {
  const quantity = options.quantity ?? 1

  if (isNumericRollOptions(options)) {
    return coreSpreadRolls<number>(quantity, options.sides)
  } else {
    return coreSpreadRolls(quantity, options.sides.length, options.sides)
  }
}
