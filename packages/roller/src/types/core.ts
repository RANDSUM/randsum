import type { DiceNotation, RollOptions } from '@randsum/notation'

// Re-export notation types for backward compatibility
export type { DiceNotation, RollOptions } from '@randsum/notation'

/**
 * RollOptions with required numeric fields.
 * Used internally when sides must be numeric and quantity is known.
 */
export interface RequiredNumericRollParameters {
  quantity: number
  sides: number
}

/**
 * Valid input types for the roll() function.
 *
 * @template T - Type for custom dice faces
 *
 * @example
 * ```ts
 * roll(20)              // number - d20
 * roll("4d6L")          // notation string
 * roll({ sides: 6, quantity: 4 })  // options object
 * ```
 */
export type RollArgument<T = string> = RollOptions<T> | DiceNotation | number

/**
 * Type for custom random number generators.
 * Must return a number in the range [0, 1).
 */
export type RandomFn = () => number

/**
 * Configuration options for roll execution.
 */
export interface RollConfig {
  /** Custom random function (default: Math.random) */
  randomFn?: RandomFn
}
