import type { RollParams } from '../../types'
import { isRollOptions } from './isRollOptions'

export function isRollParams(
  poolParameters: unknown
): poolParameters is RollParams {
  if (typeof poolParameters !== 'object' || poolParameters === null) {
    return false
  }

  const obj = poolParameters as Record<string, unknown>

  return (
    'description' in obj &&
    Array.isArray(obj['description']) &&
    'argument' in obj &&
    obj['argument'] !== null &&
    obj['argument'] !== undefined &&
    'options' in obj &&
    isRollOptions(obj['options']) &&
    'notation' in obj &&
    typeof obj['notation'] === 'string'
  )
}
