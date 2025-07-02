import type {
  CustomRollResult,
  MixedRollResult,
  NumericRollResult,
  RollResult
} from '../types'

export function isNumericResult(
  result: RollResult
): result is NumericRollResult {
  return result.type === 'numeric'
}

export function isCustomResult(result: RollResult): result is CustomRollResult {
  return result.type === 'custom'
}

export function isMixedResult(result: RollResult): result is MixedRollResult {
  return result.type === 'mixed'
}
