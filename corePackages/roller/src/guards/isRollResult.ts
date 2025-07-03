import type {
  CustomRollResult,
  MixedRollResult,
  NumericRollResult,
  RollResult
} from '../types'

export function isNumericResult(
  result: RollResult
): result is NumericRollResult {
  return isRollResult(result) && result.type === 'numeric'
}

export function isCustomResult(result: RollResult): result is CustomRollResult {
  return isRollResult(result) && result.type === 'custom'
}

export function isMixedResult(result: RollResult): result is MixedRollResult {
  return isRollResult(result) && result.type === 'mixed'
}

export function isRollResult(result: unknown): result is RollResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'type' in result &&
    'rolls' in result &&
    'rawResults' in result &&
    'total' in result
  )
}
