import { roll } from './roll'
import type { CustomRollResult } from './types'

export function rollCustom<T>(faces: T[]): CustomRollResult<T> {
  const baseResult = roll({
    sides: faces.length,
    quantity: 1
  })
  if (faces.length === 0) {
    throw new Error('Failed to properly roll.')
  }

  const result = faces[baseResult.total - 1] as T

  return {
    baseResult,
    result
  }
}
