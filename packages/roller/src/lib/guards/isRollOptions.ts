import type { RollOptions } from '../../types'

export function isRollOptions(options: unknown): options is RollOptions {
  if (typeof options !== 'object' || options === null) {
    return false
  }

  const obj = options as Record<string, unknown>

  return (
    'sides' in obj &&
    typeof obj['sides'] === 'number' &&
    (obj['quantity'] === undefined || typeof obj['quantity'] === 'number') &&
    (obj['modifiers'] === undefined ||
      (typeof obj['modifiers'] === 'object' &&
        obj['modifiers'] !== null &&
        !Array.isArray(obj['modifiers'])))
  )
}
