import type { InvalidValidationResult } from '../../types'

export function isInvalidValidationResult(
  result: unknown
): result is InvalidValidationResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'valid' in result &&
    'description' in result &&
    !result.valid
  )
}
