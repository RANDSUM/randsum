import { validateGreaterThan, validateInteger } from './utils'
import type { RollOptions } from '../types'
import { validateModifiersFromRegistry } from './modifiers'

/**
 * Validates roll options for correctness.
 *
 * Ensures that sides, quantity, and modifiers are all valid before rolling.
 * This provides runtime validation for the options API (complementary to
 * isDiceNotation validation for the notation string API).
 *
 * @param options - Roll options to validate
 * @throws Error if options are invalid
 *
 * @example
 * ```ts
 * validateRollOptions({ sides: 6, quantity: 4 }) // OK
 * validateRollOptions({ sides: -5, quantity: 0.5 }) // Throws error
 * ```
 */
export function validateRollOptions<T>(options: RollOptions<T>): void {
  // Validate sides
  if (typeof options.sides === 'number') {
    validateGreaterThan(options.sides, 0, 'sides')
    validateInteger(options.sides, 'sides')
  } else if (Array.isArray(options.sides)) {
    if (options.sides.length === 0) {
      throw new Error('sides array must not be empty')
    }
  }

  // Validate quantity
  if (options.quantity !== undefined) {
    validateGreaterThan(options.quantity, 0, 'quantity')
    validateInteger(options.quantity, 'quantity')
  }

  // Validate modifier sanity using registry-based validation
  if (options.modifiers) {
    const sides = typeof options.sides === 'number' ? options.sides : options.sides.length
    const quantity = options.quantity ?? 1
    validateModifiersFromRegistry(options.modifiers, { sides, quantity })
  }
}
