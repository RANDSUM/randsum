import type { CustomRollOptions, NumericRollOptions } from '@randsum/core'

export function isNumericRollOptions(
  options: NumericRollOptions | CustomRollOptions
): options is NumericRollOptions {
  return typeof (options as NumericRollOptions).sides === 'number'
}
