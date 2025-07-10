import type { CustomRollArgument, CustomRollOptions } from '../types'

export function argToOptions<T>(
  arg: CustomRollArgument<T>
): CustomRollOptions<T> {
  if (Array.isArray(arg)) {
    return { faces: arg, quantity: 1 }
  }
  return { quantity: 1, ...arg }
}
