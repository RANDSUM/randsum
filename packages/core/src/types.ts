/**
 * @file Core type definitions for the RANDSUM dice rolling system
 * @module @randsum/core/types
 */

// --------------------------
// --- 'notation' & STRINGS ---
// --------------------------

/**
 * String template for standard numeric dice notation
 *
 * Follows the format: `<quantity>d<sides><optional modifiers>`
 *
 * @example "1d20" - Roll one twenty-sided die
 * @example "3d6+2" - Roll three six-sided dice and add 2
 * @example "2d8L1" - Roll two eight-sided dice and drop the lowest
 */
export type NumericDiceNotation = `${number}${'d' | 'D'}${number}${string}`

/**
 * String template for custom dice notation with non-numeric faces
 *
 * Follows the format: `<quantity>d{<comma-separated faces>}<optional modifiers>`
 *
 * @example "1d{heads,tails}" - Roll one coin with heads and tails faces
 * @example "2d{red,green,blue}" - Roll two dice with color faces
 */
export type CustomDiceNotation = `${number}${'d' | 'D'}{${string}}`

/**
 * Union type representing all supported dice notation formats
 */
export type DiceNotation = NumericDiceNotation | CustomDiceNotation

// -----------------------
// --- MODIFIER OPTIONS ---
// -----------------------

/**
 * Options for comparing dice roll values against thresholds
 *
 * Used by various modifiers to determine which dice to affect based on
 * their values being greater than or less than specified thresholds.
 *
 * @interface
 */
export interface ComparisonOptions {
  /**
   * Threshold for values that should be greater than this number
   *
   * @example
   * // Affects dice with values > 4
   * { greaterThan: 4 }
   */
  greaterThan?: number

  /**
   * Threshold for values that should be less than this number
   *
   * @example
   * // Affects dice with values < 3
   * { lessThan: 3 }
   */
  lessThan?: number
}

/**
 * Options for dropping dice from the roll results
 *
 * Extends ComparisonOptions to allow dropping dice based on their values
 * being greater than or less than specified thresholds, as well as
 * dropping the highest or lowest N dice, or dice with exact values.
 *
 * @interface
 * @extends {ComparisonOptions}
 */
export interface DropOptions extends ComparisonOptions {
  /**
   * Number of highest dice to drop from the results
   *
   * @example
   * // Drop the highest die
   * { highest: 1 }
   */
  highest?: number

  /**
   * Number of lowest dice to drop from the results
   *
   * @example
   * // Drop the 2 lowest dice
   * { lowest: 2 }
   */
  lowest?: number

  /**
   * Array of exact values to drop from the results
   *
   * @example
   * // Drop any 1s and 2s
   * { exact: [1, 2] }
   */
  exact?: number[]
}

/**
 * Options for rerolling dice that match specific criteria
 *
 * Extends ComparisonOptions to allow rerolling dice based on their values
 * being greater than or less than specified thresholds, as well as
 * rerolling dice with exact values, with an optional maximum number of rerolls.
 *
 * @interface
 * @extends {ComparisonOptions}
 */
export interface RerollOptions extends ComparisonOptions {
  /**
   * Array of exact values to reroll
   *
   * @example
   * // Reroll any 1s
   * { exact: [1] }
   */
  exact?: number[]

  /**
   * Maximum number of times to reroll a single die
   * Prevents infinite rerolling loops
   *
   * @example
   * // Reroll at most twice
   * { max: 2 }
   */
  max?: number
}

/**
 * Options for replacing dice values with other values
 *
 * Allows replacing specific dice values or dice that match comparison criteria
 * with a new specified value.
 *
 * @interface
 */
export interface ReplaceOptions {
  /**
   * The value or condition to replace
   * Can be a specific number or a comparison condition
   *
   * @example
   * // Replace all 1s
   * { from: 1, to: 2 }
   *
   * @example
   * // Replace all values greater than 18
   * { from: { greaterThan: 18 }, to: 18 }
   */
  from: number | ComparisonOptions

  /**
   * The new value to use as a replacement
   *
   * @example
   * // Replace with 3
   * { from: 1, to: 3 }
   */
  to: number
}

/**
 * Options for ensuring unique dice values
 *
 * Allows specifying which values are allowed to be duplicated
 * when using the unique modifier.
 *
 * @interface
 */
export interface UniqueOptions {
  /**
   * Array of values that are allowed to be duplicated
   * All other values must be unique
   *
   * @example
   * // Allow 1s to be duplicated, but all other values must be unique
   * { notUnique: [1] }
   */
  notUnique: number[]
}

/**
 * Combined options for all dice roll modifiers
 *
 * This interface aggregates all possible modifier options that can be
 * applied to a dice roll. Each property corresponds to a specific modifier type.
 *
 * @interface
 */
export interface ModifierOptions {
  /**
   * Options for capping dice values at thresholds
   *
   * @example
   * // Cap values greater than 18 at 18
   * { cap: { greaterThan: 18 } }
   */
  cap?: ComparisonOptions

  /**
   * Options for dropping dice from the results
   *
   * @example
   * // Drop the lowest die
   * { drop: { lowest: 1 } }
   */
  drop?: DropOptions

  /**
   * Options for replacing dice values
   * Can be a single replacement rule or an array of rules
   *
   * @example
   * // Replace all 1s with 2s
   * { replace: { from: 1, to: 2 } }
   */
  replace?: ReplaceOptions | ReplaceOptions[]

  /**
   * Options for rerolling dice
   *
   * @example
   * // Reroll 1s up to 2 times
   * { reroll: { exact: [1], max: 2 } }
   */
  reroll?: RerollOptions

  /**
   * Options for ensuring unique dice values
   * Can be a boolean to enforce all values are unique,
   * or an object specifying which values can be duplicated
   *
   * @example
   * // All dice must have unique values
   * { unique: true }
   *
   * @example
   * // All dice must be unique except 1s
   * { unique: { notUnique: [1] } }
   */
  unique?: boolean | UniqueOptions

  /**
   * Whether to add an additional die roll for each maximum value rolled
   *
   * @example
   * // Roll an extra die for each maximum value
   * { explode: true }
   */
  explode?: boolean

  /**
   * Value to add to the final roll total
   *
   * @example
   * // Add 3 to the total
   * { plus: 3 }
   */
  plus?: number

  /**
   * Value to subtract from the final roll total
   *
   * @example
   * // Subtract 2 from the total
   * { minus: 2 }
   */
  minus?: number
}

// -----------------------
// --- ROLL BONUSES ---
// -----------------------

/**
 * Represents the intermediate state of a numeric dice roll
 *
 * Contains the individual dice values and any simple mathematical
 * modifiers (like plus or minus) that should be applied to the total.
 *
 * @interface
 */
export interface NumericRollBonus {
  /**
   * Array of individual dice values from the roll
   *
   * @example
   * // Results of rolling 3d6
   * { rolls: [4, 2, 6], simpleMathModifier: 0 }
   */
  rolls: number[]

  /**
   * Simple mathematical modifier to apply to the roll total
   * Positive for addition, negative for subtraction
   *
   * @example
   * // +3 modifier
   * { rolls: [4, 2, 6], simpleMathModifier: 3 }
   *
   * @example
   * // -2 modifier
   * { rolls: [4, 2, 6], simpleMathModifier: -2 }
   */
  simpleMathModifier: number
}

// -----------------------
// --- ROLL OPTIONS ---
// -----------------------

/**
 * Base options that apply to all dice roll types
 *
 * @interface
 */
export interface BaseRollOptions {
  /**
   * Optional quantity of dice to roll
   *
   * @example
   * // Roll 3 dice
   * { quantity: 3 }
   */
  quantity?: number
}

/**
 * Options for numeric dice rolls
 *
 * Extends BaseRollOptions with properties specific to numeric dice,
 * such as the number of sides and modifiers.
 *
 * @interface
 * @extends {BaseRollOptions}
 */
export interface NumericRollOptions extends BaseRollOptions {
  /**
   * Number of sides on each die
   *
   * @example
   * // Roll 20-sided dice
   * { sides: 20 }
   */
  sides: number

  /**
   * Optional modifiers to apply to the roll
   *
   * @example
   * // Roll with advantage (drop lowest)
   * { modifiers: { drop: { lowest: 1 } } }
   */
  modifiers?: ModifierOptions
}

/**
 * Options for custom dice rolls with non-numeric faces
 *
 * Extends BaseRollOptions with properties specific to custom dice,
 * such as the array of string faces and modifiers.
 *
 * @interface
 * @extends {BaseRollOptions}
 */
export interface CustomRollOptions extends BaseRollOptions {
  /**
   * Number of dice to roll
   *
   * @example
   * // Roll 2 dice
   * { quantity: 2 }
   */
  quantity?: number

  /**
   * Array of string values representing the faces of the die
   *
   * @example
   * // Create a coin with heads and tails
   * { sides: ['Heads', 'Tails'] }
   *
   * @example
   * // Create a color die
   * { sides: ['Red', 'Green', 'Blue', 'Yellow'] }
   */
  sides: string[]

  /**
   * Optional modifiers to apply to the roll
   *
   * @example
   * // Roll with a modifier
   * { modifiers: {} }
   */
  modifiers?: Record<string, never>
}

/**
 * Union type representing all possible roll options
 *
 * @type {NumericRollOptions | CustomRollOptions}
 */
export type RollOptions = NumericRollOptions | CustomRollOptions

// -----------------------
// --  ROLL PARAMETERS ---
// -----------------------

/**
 * Required parameters for numeric dice rolls
 *
 * Contains the essential information needed to perform a numeric dice roll,
 * derived from NumericRollOptions but with all properties required except modifiers.
 *
 * @type {Required<Omit<NumericRollOptions, 'modifiers'>>}
 */
export type RequiredNumericRollParameters = Required<
  Omit<NumericRollOptions, 'modifiers'>
>
