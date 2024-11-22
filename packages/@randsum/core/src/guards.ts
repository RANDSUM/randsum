import type { Modifiers } from './types'

export function isValidModifier(
  modifiers: unknown | Modifiers | undefined
): modifiers is Modifiers {
  return Object.keys(modifiers || {}).length > 0
}
