import type { CustomRollArgument, CustomRollOptions } from '../types'

export function argToOptions<T>(
  arg: CustomRollArgument<T>
): CustomRollOptions<T> {
  if (Array.isArray(arg)) {
    return { faces: arg }
  }
  return { ...arg }
}
