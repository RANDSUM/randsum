import type {
  CustomRollResult,
  NumericRollResult,
  RollResult
} from '../../types'

export function isNumericResult(result: unknown): result is NumericRollResult {
  return isRollResult(result) && result.type === 'numeric'
}

export function isCustomResult(result: unknown): result is CustomRollResult {
  return isRollResult(result) && result.type === 'custom'
}

export function isRollResult(result: unknown): result is RollResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'history' in result &&
    'type' in result &&
    'total' in result
  )
}
