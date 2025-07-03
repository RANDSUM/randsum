import type { RollParams, RollPoolResult } from '../../../types'
import { isNumericRollOptions } from '../../guards'
import { coreSpreadRolls } from '../coreSpreadRolls'

export function generateRawRolls({
  options
}: RollParams): RollPoolResult['rawRolls'] {
  const quantity = options.quantity ?? 1

  if (isNumericRollOptions(options)) {
    return coreSpreadRolls<number>(quantity, options.sides)
  } else {
    return coreSpreadRolls(quantity, options.sides.length, options.sides)
  }
}
