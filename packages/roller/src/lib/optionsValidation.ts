import {
  validateGreaterThan,
  validateInteger,
  validateMaxQuantity,
  validateMaxSides
} from './utils/validation'
import type { RollOptions } from '../types'
import { ValidationError } from '../errors'

/**
 * Validates roll options for correctness.
 *
 * Ensures that sides and quantity are valid before rolling. Modifiers are
 * validated later, in `parseArguments`, for options and notation alike.
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
  if (typeof options.sides === 'number') {
    validateGreaterThan(options.sides, 0, 'sides')
    validateInteger(options.sides, 'sides')
    validateMaxSides(options.sides)
  } else if (Array.isArray(options.sides)) {
    if (options.sides.length === 0) {
      throw new ValidationError('sides array must not be empty', {
        path: 'sides',
        value: options.sides
      })
    }
    validateMaxSides(options.sides.length)
  }

  if (options.quantity !== undefined) {
    validateGreaterThan(options.quantity, 0, 'quantity')
    validateInteger(options.quantity, 'quantity')
    validateMaxQuantity(options.quantity)
  }
}
