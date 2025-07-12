import type { RollResult } from '../../types'

export function isRollResult(result: unknown): result is RollResult {
  if (typeof result !== 'object' || result === null) {
    return false
  }

  const obj = result as Record<string, unknown>

  return (
    'parameters' in obj &&
    typeof obj['parameters'] === 'object' &&
    obj['parameters'] !== null &&
    'description' in obj &&
    Array.isArray(obj['description']) &&
    'rolls' in obj &&
    Array.isArray(obj['rolls']) &&
    'history' in obj &&
    typeof obj['history'] === 'object' &&
    obj['history'] !== null &&
    'total' in obj &&
    typeof obj['total'] === 'number'
  )
}
