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
 * String literal type for percentile dice (d%).
 * Equivalent to rolling 1d100.
 */
export type PercentileDie = 'd%' | 'D%'

/**
 * Fate/Fudge dice notation variants.
 *
 * - `dF` / `dF.1` — standard Fudge die: faces [-1, 0, 1]
 * - `dF.2` — extended Fudge die: faces [-2, -1, 0, 1, 2]
 *
 * Case-insensitive (dF and DF are equivalent).
 */
type FateDieLiteral =
  | 'dF'
  | 'DF'
  | 'df'
  | 'Df'
  | 'dF.1'
  | 'DF.1'
  | 'df.1'
  | 'Df.1'
  | 'dF.2'
  | 'DF.2'
  | 'df.2'
  | 'Df.2'

/**
 * Fate/Fudge dice notation with optional quantity prefix.
 * Matches patterns like `dF`, `4dF`, `dF.1`, `4dF.2`, etc.
 */
export type FateDieNotation = FateDieLiteral | `${number}${FateDieLiteral}`

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
 * roll("d%")            // percentile (1d100)
 * roll("4dF")           // four Fate/Fudge dice
 * ```
 */
export type RollArgument<T = string> =
  | RollOptions<T>
  | DiceNotation
  | FateDieNotation
  | PercentileDie
  | number

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
