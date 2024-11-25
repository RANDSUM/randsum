import type { CustomRollConfigArgument } from './types'

export function isCustomRollConfigArgument(
  arg: unknown
): arg is CustomRollConfigArgument {
  return typeof arg === 'object' && !!arg && 'faces' in arg
}
