import { CustomD } from './customD'
import type { CustomRollConfigArgument } from './types'

export function isCustomRollConfigArgument(
  value: unknown
): value is CustomRollConfigArgument {
  return (
    typeof value === 'object' &&
    value !== null &&
    'faces' in value &&
    Array.isArray(value.faces)
  )
}

export function isCustomD(value: unknown): value is CustomD {
  return value instanceof CustomD
}
