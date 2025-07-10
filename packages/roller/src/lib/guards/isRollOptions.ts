import type { RollOptions } from '../../types'

export function isRollOptions(options: unknown): options is RollOptions {
  return (
    typeof options === 'object' &&
    options !== null &&
    typeof (options as RollOptions).sides === 'number'
  )
}
