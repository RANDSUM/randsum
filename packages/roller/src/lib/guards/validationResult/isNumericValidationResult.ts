import type { NumericValidationResult } from '../../../types'

export function isNumericValidationResult(
  result: unknown
): result is NumericValidationResult {
  return !!(
    typeof result === 'object' &&
    result !== null &&
    'valid' in result &&
    'type' in result &&
    'description' in result &&
    result.valid &&
    result.type === 'numeric'
  )
}
