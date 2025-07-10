import type { ValidationResult } from '../../types'

export function isValidationResult(
  result: unknown
): result is ValidationResult {
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
