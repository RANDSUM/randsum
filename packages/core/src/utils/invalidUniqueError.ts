/**
 * @file Custom error for invalid unique dice configurations
 * @module @randsum/core/utils/invalidUniqueError
 */

import { RollConstraintError } from './rollConstraintError'

/**
 * Error thrown when a unique dice configuration is invalid
 *
 * This error is thrown when attempting to roll unique dice (no duplicates)
 * but the number of dice being rolled exceeds the number of sides on the die,
 * making it impossible to have all unique values.
 *
 * @example
 * // This would throw an InvalidUniqueError because you can't roll 7 unique values on a 6-sided die
 * roll({ sides: 6, quantity: 7, modifiers: { unique: true } });
 *
 * @deprecated Use RollConstraintError.forUniqueRollViolation() instead
 */
export class InvalidUniqueError extends RollConstraintError {
  /**
   * Creates a new InvalidUniqueError instance
   *
   * @param sides - Number of sides on the die (optional, for better error messages)
   * @param quantity - Number of dice being rolled (optional, for better error messages)
   */
  constructor(sides?: number, quantity?: number) {
    if (sides && quantity) {
      // Use the enhanced error with specific details
      super(
        `Cannot roll ${String(quantity)} unique values on a ${String(sides)}-sided die`,
        {
          details: { sides, quantity, constraint: 'unique_rolls' },
          expected: `Quantity ≤ ${String(sides)} for unique rolls`
        },
        [
          `Reduce quantity to ${String(sides)} or fewer dice`,
          'Remove the unique modifier to allow duplicates',
          `Use a d${String(quantity)} or larger die for ${String(quantity)} unique rolls`
        ]
      )
    } else {
      // Maintain backward compatibility with original message
      super(
        'You cannot have unique rolls when there are more rolls than sides of die.',
        {
          details: { constraint: 'unique_rolls' }
        },
        [
          'Ensure the number of dice is not greater than the number of sides',
          'Remove the unique modifier if duplicate values are acceptable'
        ]
      )
    }

    this.name = 'InvalidUniqueError'
  }
}
