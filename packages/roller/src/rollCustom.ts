import { roll } from './roll'
import type { CustomRollArgument, CustomRollResult } from './types'

export function rollCustom<T>(
  faces: CustomRollArgument<T>
): CustomRollResult<T> {
  const baseResult = roll({
    sides: faces.length,
    quantity: 1
  })

  const result = faces[baseResult.total - 1]

  if (result === undefined) {
    throw new Error('Failed to properly roll.')
  }

  return {
    baseResult,
    result
  }
}
