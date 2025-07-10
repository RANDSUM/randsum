import type { CustomRollArgument, CustomRollOptions } from '../types'

export function argToOption<T>(
  arg: CustomRollArgument<T>
): CustomRollOptions<T> {
  if (Array.isArray(arg)) {
    return { faces: arg }
  }
  return { ...arg }
}
