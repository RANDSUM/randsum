import type { NumericRollArgument } from '../../types'
import { isD } from './isD'
import { isNumericDiceNotation } from './isNumericDiceNotation'
import { isNumericRollOptions } from './isNumericRollOptions'

export function isNumericRollArgument(
  argument: unknown
): argument is NumericRollArgument {
  return (
    isNumericDiceNotation(argument) ||
    isNumericRollOptions(argument) ||
    (isD(argument) && !argument.isCustom) ||
    typeof argument === 'number' ||
    (typeof argument === 'string' && !isNaN(Number(argument)))
  )
}
