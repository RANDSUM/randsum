import type { CustomRollOptions, NumericRollOptions } from '@randsum/core'

/**
 * Type guard to determine if roll options are for numeric dice
 *
 * This function checks if the provided roll options are for numeric dice
 * by verifying that the sides property is a number rather than a string array.
 *
 * @param options - The roll options to check
 * @returns True if the options are for numeric dice, false otherwise
 */
export function isNumericRollOptions(
  options: NumericRollOptions | CustomRollOptions
): options is NumericRollOptions {
  return typeof options.sides === 'number'
}
