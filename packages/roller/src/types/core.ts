import type { ModifierOptions } from './modifiers'
import type { DiceNotation } from '@randsum/notation'

// Re-export DiceNotation from notation for backward compatibility
export type { DiceNotation } from '@randsum/notation'

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
  /**
   * Optional identifier for this roll in multi-roll expressions.
   *
   * When `roll()` receives multiple arguments, each produces a `RollRecord`
   * with a `parameters.key` for identification. Default keys are
   * auto-generated as `"Roll 1"`, `"Roll 2"`, etc.
   *
   * Provide a `key` via `RollOptions` for stable, meaningful identifiers
   * when you need to look up specific rolls from a multi-roll result.
   *
   * @example
   * ```ts
   * const result = roll(
   *   { sides: 20, key: 'attack' },
   *   { sides: 6, quantity: 2, modifiers: { plus: 3 }, key: 'damage' }
   * )
   * const attack = result.rolls.find(r => r.parameters.key === 'attack')
   * const damage = result.rolls.find(r => r.parameters.key === 'damage')
   * ```
   */
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
