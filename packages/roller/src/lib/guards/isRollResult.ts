import type {
  CustomRollResult,
  NumericRollResult,
  RollResult
} from '../../types'

export function isNumericResult(
  result: RollResult
): result is NumericRollResult {
  return isRollResult(result) && result.type === 'numeric'
}

export function isCustomResult(result: RollResult): result is CustomRollResult {
  return isRollResult(result) && result.type === 'custom'
}

export function isRollResult(result: unknown): result is RollResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'modifiedRolls' in result &&
    'type' in result &&
    'total' in result
  )
}
