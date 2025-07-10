import type { RollResult } from '../../types'

export function isRollResult(result: unknown): result is RollResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'history' in result &&
    'total' in result
  )
}
