/**
 * @file Custom error for invalid unique dice configurations
 * @module @randsum/core/utils/invalidUniqueError
 */

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
 */
export class InvalidUniqueError extends Error {
  /**
   * Creates a new InvalidUniqueError instance
   */
  constructor() {
    super(
      'You cannot have unique rolls when there are more rolls than sides of die.'
    )
  }
}
