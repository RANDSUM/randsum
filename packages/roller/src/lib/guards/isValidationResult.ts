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
    'options' in obj &&
    typeof obj['options'] === 'object' &&
    obj['options'] !== null &&
    (obj['valid']
      ? 'notation' in obj && typeof obj['notation'] === 'string'
      : true)
  )
}
