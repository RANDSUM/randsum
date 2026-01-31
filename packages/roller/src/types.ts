// ============================================================================
// Core Types
// ============================================================================

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
 * @deprecated Use `DiceNotation` instead. Kept for backward compatibility.
 */
export type DiceNotationTemplate = `${number}${'d' | 'D'}${number}${string}`

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
 * Options for comparison-based operations (greater/less than).
 *
 * Used by cap, drop, reroll, and replace modifiers.
 *
 * @example
 * ```ts
 * // Cap rolls to max 18
 * { greaterThan: 18 }
 *
 * // Drop rolls below 3
 * { lessThan: 3 }
 * ```
 */
export interface ComparisonOptions {
  /** Threshold for "greater than" comparisons */
  greaterThan?: number
  /** Threshold for "less than" comparisons */
  lessThan?: number
}

/**
 * Options for the drop modifier.
 *
 * Specifies which dice to remove from the roll result.
 *
 * @example
 * ```ts
 * // D&D ability score: 4d6 drop lowest
 * { lowest: 1 }
 *
 * // Advantage: 2d20 drop lowest (keep highest)
 * { lowest: 1 }
 *
 * // Drop all 1s and 2s
 * { exact: [1, 2] }
 * ```
 */
export interface DropOptions extends ComparisonOptions {
  /** Number of highest dice to drop */
  highest?: number
  /** Number of lowest dice to drop */
  lowest?: number
  /** Specific values to drop */
  exact?: number[]
}

/**
 * Options for the keep modifier.
 *
 * Specifies which dice to keep from the roll result.
 * This is the complement to drop - keeping N highest is equivalent to dropping (quantity - N) lowest.
 *
 * @example
 * ```ts
 * // Keep 3 highest from 4d6 (equivalent to drop lowest)
 * { highest: 3 }
 *
 * // Keep 2 lowest
 * { lowest: 2 }
 * ```
 */
export interface KeepOptions {
  /** Number of highest dice to keep */
  highest?: number
  /** Number of lowest dice to keep */
  lowest?: number
}

/**
 * Options for the reroll modifier.
 *
 * Specifies conditions for rerolling dice.
 *
 * @example
 * ```ts
 * // Reroll 1s
 * { exact: [1] }
 *
 * // Reroll values below 3, max 2 rerolls
 * { lessThan: 3, max: 2 }
 * ```
 */
export interface RerollOptions extends ComparisonOptions {
  /** Specific values to reroll */
  exact?: number[]
  /** Maximum number of rerolls allowed */
  max?: number
}

/**
 * Options for the replace modifier.
 *
 * Specifies value replacements to apply.
 *
 * @example
 * ```ts
 * // Replace 1s with 2s
 * { from: 1, to: 2 }
 *
 * // Replace values greater than 5 with 5
 * { from: { greaterThan: 5 }, to: 5 }
 * ```
 */
export interface ReplaceOptions {
  /** Value or comparison to match for replacement */
  from: number | ComparisonOptions
  /** Value to replace matched rolls with */
  to: number
}

/**
 * Options for the unique modifier.
 *
 * Ensures all dice show different values.
 *
 * @example
 * ```ts
 * // Allow 1s to repeat, all others unique
 * { notUnique: [1] }
 * ```
 */
export interface UniqueOptions {
  /** Values that are allowed to repeat */
  notUnique: number[]
}

/**
 * Union type of all possible modifier configuration values.
 */
export type ModifierConfig =
  | number
  | boolean
  | ComparisonOptions
  | DropOptions
  | KeepOptions
  | ReplaceOptions
  | ReplaceOptions[]
  | RerollOptions
  | UniqueOptions
  | SuccessCountOptions

/**
 * All available dice roll modifiers.
 *
 * Modifiers are applied in order: reroll → explode → replace → drop → cap → arithmetic
 *
 * @example
 * ```ts
 * const modifiers: ModifierOptions = {
 *   drop: { lowest: 1 },      // Drop lowest die
 *   reroll: { exact: [1] },   // Reroll 1s
 *   plus: 5                   // Add 5 to total
 * }
 * ```
 */
/**
 * Options for success counting (dice pool systems like World of Darkness, Shadowrun).
 *
 * Counts how many dice meet a threshold, rather than summing their values.
 *
 * @example
 * ```ts
 * // World of Darkness: count successes >= 8
 * { threshold: 8 }
 *
 * // Shadowrun: count successes >= 5
 * { threshold: 5 }
 * ```
 */
export interface SuccessCountOptions {
  /** Threshold for counting successes (rolls >= this value) */
  threshold: number
  /** Optional: threshold for counting botches/failures (rolls <= this value) */
  botchThreshold?: number
}

export interface ModifierOptions {
  /** Cap roll values to a range */
  cap?: ComparisonOptions
  /** Drop dice from the result */
  drop?: DropOptions
  /** Keep dice from the result (complement to drop) */
  keep?: KeepOptions
  /** Replace specific values */
  replace?: ReplaceOptions | ReplaceOptions[]
  /** Reroll dice matching conditions */
  reroll?: RerollOptions
  /** Ensure unique values (true or options) */
  unique?: boolean | UniqueOptions
  /**
   * Exploding dice: reroll and add on max value.
   * - true: explode once per die (backward compatible)
   * - number: max explosion depth (0 = unlimited, capped at 100 for safety)
   */
  explode?: boolean | number
  /**
   * Compounding exploding: add to triggering die instead of creating new dice.
   * - true: compound once per die (backward compatible)
   * - number: max compound depth (0 = unlimited, capped at 100 for safety)
   */
  compound?: boolean | number
  /**
   * Penetrating exploding: subtract 1 from each subsequent explosion.
   * - true: penetrate once per die (backward compatible)
   * - number: max penetrate depth (0 = unlimited, capped at 100 for safety)
   */
  penetrate?: boolean | number
  /** Count successes instead of summing (for dice pool systems) */
  countSuccesses?: SuccessCountOptions
  /** Multiply dice result (before +/- arithmetic) */
  multiply?: number
  /** Add a fixed value to the total */
  plus?: number
  /** Subtract a fixed value from the total */
  minus?: number
  /** Multiply final total (after all other modifiers) */
  multiplyTotal?: number
}

/**
 * Log entry for a single modifier application.
 *
 * Records what changed when a modifier was applied.
 */
export interface ModifierLog {
  /** Name of the modifier that was applied */
  modifier: string
  /** Configuration used for this modifier */
  options: ModifierConfig | undefined
  /** Values that were added by this modifier */
  added: number[]
  /** Values that were removed by this modifier */
  removed: number[]
}

/**
 * Intermediate state during modifier processing.
 */
export interface NumericRollBonus {
  /** Current roll values */
  rolls: number[]
  /** Arithmetic modifier (+/-) to apply to total */
  simpleMathModifier: number
  /** History of modifier applications */
  logs: ModifierLog[]
}

/**
 * Fully resolved parameters for a single roll.
 *
 * Contains all information needed to execute and describe the roll.
 *
 * @template T - Type for custom dice faces
 */
export interface RollParams<T = string> extends Required<Omit<RollOptions<T>, 'sides'>> {
  /** Numeric sides (always resolved to number) */
  sides: number
  /** Custom face values if using non-numeric dice */
  faces?: T[]
  /** Original input argument */
  argument: RollArgument<T>
  /** Human-readable description of the roll */
  description: string[]
  /** Dice notation string */
  notation: DiceNotation
}

/**
 * Complete record of a single roll execution.
 *
 * Contains the input parameters, raw rolls, modifier history,
 * and final computed results.
 *
 * @template T - Type for custom dice faces
 */
export interface RollRecord<T = string> {
  /** Human-readable description */
  description: RollParams<T>['description']
  /** Full roll parameters */
  parameters: RollParams<T>
  /** Raw die results before modifiers */
  rolls: number[]
  /** History of modifier applications */
  modifierHistory: {
    /** Logs from each modifier */
    logs: NumericRollBonus['logs']
    /** Rolls after all modifiers */
    modifiedRolls: number[]
    /** Total after modifiers */
    total: number
    /** Original rolls before modifiers */
    initialRolls: number[]
  }
  /** Total including arithmetic modifiers */
  appliedTotal: number
  /** Custom face results (for non-numeric dice) */
  customResults?: T[]
  /** Final total for this roll */
  total: number
}

/**
 * Generic roll result container.
 *
 * @template TResult - Type of the overall result
 * @template TRollRecord - Type of individual roll records
 */
export interface RollResult<TResult = number, TRollRecord = RollRecord> {
  /** Individual roll records */
  rolls: TRollRecord[]
  /** Aggregate result */
  result: TResult
}

/**
 * Result from the roll() function.
 *
 * Contains all roll records, individual results, and the combined total.
 *
 * @template T - Type for custom dice faces
 *
 * @example
 * ```ts
 * const result: RollerRollResult = roll("4d6L")
 * console.log(result.total)   // Sum of kept dice
 * console.log(result.result)  // Array of individual die values
 * console.log(result.rolls)   // Full roll records with history
 * ```
 */
export interface RollerRollResult<T = string> extends RollResult<T[], RollRecord<T>> {
  /** Combined total of all rolls */
  total: number
}

/**
 * Successful validation result.
 *
 * Returned when dice notation is valid.
 */
export interface ValidValidationResult {
  /** Indicates successful validation */
  valid: true
  /** Original input as DiceNotation */
  argument: DiceNotation
  /** Human-readable descriptions for each roll */
  description: string[][]
  /** Parsed roll options for each roll */
  options: RollOptions[]
  /** Notation strings for each roll */
  notation: DiceNotation[]
}

/**
 * Failed validation result.
 *
 * Returned when dice notation is invalid.
 */
export interface InvalidValidationResult {
  /** Indicates failed validation */
  valid: false
  /** Original input string */
  argument: string
}

/**
 * Error information from validation.
 */
export interface ValidationError {
  /** Description of what's wrong */
  message: string
  /** The input that failed validation */
  argument: string
}

/**
 * Result of notation validation using Result pattern.
 *
 * Either a successful ValidValidationResult or a ValidationError.
 */
import type { Result } from './lib/result'
export type ValidationResult = Result<ValidValidationResult, ValidationError>

// ============================================================================
// Game Roll Result
// ============================================================================

/**
 * Generic interface for game-specific roll results.
 * Game packages should implement this interface for their roll functions.
 *
 * @template TResult - The type of the game-specific result (e.g., 'hit', 'miss', 'critical')
 * @template TDetails - Optional additional details about the roll
 * @template TRollRecord - The type of roll record (typically RollRecord from @randsum/roller)
 */
export interface GameRollResult<TResult, TDetails = undefined, TRollRecord = never> {
  rolls: TRollRecord[]
  total: number
  result: TResult
  details?: TDetails
}

// ============================================================================
// Roll Configuration
// ============================================================================

import type { RandomFn } from './lib/random'

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
