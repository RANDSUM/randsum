import type { NumericRollOptions, RollOptions } from '../../types'

export function isRollOptions(options: unknown): options is NumericRollOptions {
  return (
    typeof options === 'object' &&
    options !== null &&
    typeof (options as RollOptions).sides === 'number'
  )
}
