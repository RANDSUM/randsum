import type { NumericRollOptions, RollOptions } from '../../types'
import { isD } from './isD'

export function isNumericRollOptions(
  options: unknown
): options is NumericRollOptions {
  return !isD(options) && typeof (options as RollOptions).sides === 'number'
}
