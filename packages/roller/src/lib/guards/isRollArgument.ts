import type { NumericRollArgument } from '../../types'
import { isDiceNotation } from './isDiceNotation'
import { isRollOptions } from './isRollOptions'

export function isNumericRollArgument(
  argument: unknown
): argument is NumericRollArgument {
  return (
    isDiceNotation(argument) ||
    isRollOptions(argument) ||
    typeof argument === 'number' ||
    (typeof argument === 'string' && !isNaN(Number(argument)))
  )
}
