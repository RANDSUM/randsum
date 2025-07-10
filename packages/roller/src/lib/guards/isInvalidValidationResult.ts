import type { InvalidValidationResult } from '../../types'

export function isValidationResult(
  result: unknown
): result is InvalidValidationResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'valid' in result &&
    'type' in result &&
    'description' in result &&
    !result.valid &&
    result.type === 'invalid'
  )
}
