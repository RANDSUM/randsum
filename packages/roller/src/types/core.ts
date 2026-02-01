import type { ModifierOptions } from './modifiers'

/**
 * Branded type for validated dice notation strings.
 *
 * Use `isDiceNotation()` or `notation()` to create validated DiceNotation values.
 * This ensures type safety for notation strings throughout the API.
 *
 * @example
 * ```ts
 * // Type guard validation
 * if (isDiceNotation(input)) {
 *   // input is now typed as DiceNotation
 *   roll(input)
 * }
 *
 * // Direct conversion (throws if invalid)
 * const d = notation("4d6L")
 * ```
 */
declare const __brand: unique symbol
export type DiceNotation = string & { [__brand]: 'DiceNotation' }

/**
 * Configuration options for a dice roll.
 *
 * @template T - Type for custom dice faces (defaults to string)
 *
 * @example
 * ```ts
 * // Numeric dice
 * const options: RollOptions = { sides: 20, quantity: 2 }
 *
 * // Custom faces
 * const fateOptions: RollOptions<string> = {
 *   sides: ['+', '+', ' ', ' ', '-', '-'],
 *   quantity: 4
 * }
 * ```
 */
export interface RollOptions<T = string> {
  /** Number of dice to roll (default: 1) */
  quantity?: number
  /** How this roll combines with others: 'add' or 'subtract' (default: 'add') */
  arithmetic?: 'add' | 'subtract'
  /** Number of sides, or array of custom face values */
  sides: number | T[]
  /** Modifiers to apply to the roll (drop, reroll, explode, etc.) */
  modifiers?: ModifierOptions
  /** Optional identifier for this roll in multi-roll expressions */
  key?: string | undefined
}

/**
 * RollOptions with required numeric fields.
 * Used internally when sides must be numeric and quantity is known.
 */
export type RequiredNumericRollParameters = Pick<RollOptions, 'quantity' | 'sides'> & {
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
export type RollArgument<T = string> = RollOptions<T> | DiceNotation | number | `${number}`

/**
 * Type for custom random number generators.
 * Must return a number in the range [0, 1).
 *
 * @example
 * ```ts
 * // Custom RNG using crypto
 * const cryptoRandom: RandomFn = () =>
 *   crypto.getRandomValues(new Uint32Array(1))[0] / 2**32
 *
 * // Seeded RNG for reproducibility
 * const seededRandom: RandomFn = createSeededRandom(42)
 * ```
 */
export type RandomFn = () => number

/**
 * Configuration options for roll execution.
 *
 * @example
 * ```ts
 * // Use seeded random for reproducible results
 * const seeded = createSeededRandom(42)
 * roll("1d20", { randomFn: seeded })
 * ```
 */
export interface RollConfig {
  /** Custom random function (default: Math.random) */
  randomFn?: RandomFn
}
