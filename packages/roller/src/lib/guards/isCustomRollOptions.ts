import type { CustomRollOptions, RollOptions } from '../../types'
import { isD } from './isD'

export function isCustomRollOptions(
  options: unknown
): options is CustomRollOptions {
  return (
    !isD(options) &&
    typeof options === 'object' &&
    options !== null &&
    Array.isArray((options as RollOptions).sides)
  )
}
