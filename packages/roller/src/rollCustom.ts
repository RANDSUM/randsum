import { roll } from './roll'
import type { CustomRollArgument, CustomRollResult } from './types'

export function rollCustom<T>(arg: CustomRollArgument<T>): CustomRollResult<T> {
  const baseResult = roll({
    sides: arg.length,
    quantity: 1
  })

  const result = arg[baseResult.total - 1]

  if (!result) {
    throw new Error('Failed to properly roll.')
  }

  return {
    baseResult,
    result
  }
}
