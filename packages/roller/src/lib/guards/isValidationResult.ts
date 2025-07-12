import type { ValidationResult } from '../../types'

export function isValidationResult(
  result: unknown
): result is ValidationResult {
  if (typeof result !== 'object' || result === null) {
    return false
  }

  const obj = result as Record<string, unknown>

  return (
    'valid' in obj &&
    typeof obj['valid'] === 'boolean' &&
    'description' in obj &&
    Array.isArray(obj['description']) &&
    'digested' in obj &&
    typeof obj['digested'] === 'object' &&
    obj['digested'] !== null &&
    (obj['valid']
      ? 'notation' in obj && typeof obj['notation'] === 'string'
      : true)
  )
}
