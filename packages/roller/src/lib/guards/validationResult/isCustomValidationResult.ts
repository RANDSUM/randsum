import type { CustomValidationResult } from '../../../types'

export function isCustomValidationResult(
  result: unknown
): result is CustomValidationResult {
  return !!(
    typeof result === 'object' &&
    result !== null &&
    'valid' in result &&
    'type' in result &&
    'description' in result &&
    result.valid &&
    result.type === 'custom'
  )
}
