/**
 * @file Type guard functions for RANDSUM core types
 * @module @randsum/core/guards
 */

import type { NumericRollOptions, RollOptions } from '../types'

/**
 * Type guard to determine if roll options are for numeric dice
 *
 * This function checks if the provided roll options are for numeric dice
 * by verifying that the sides property is a number rather than a string array.
 *
 * @param options - The roll options to check
 * @returns True if the options are for numeric dice, false otherwise
 *
 * @example
 * // Check if options are for numeric dice
 * const options = { sides: 20, quantity: 1 };
 * if (isNumericRollOptions(options)) {
 *   // options.sides is guaranteed to be a number here
 *   const maxValue = options.sides;
 * }
 */
export function isNumericRollOptions(
  options: RollOptions
): options is NumericRollOptions {
  return typeof options.sides === 'number'
}
