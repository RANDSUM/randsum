import type { NumericRollOptions, RollOptions } from '../types'

export function isNumericRollOptions(
  options: RollOptions
): options is NumericRollOptions {
  return typeof options.sides === 'number'
}
