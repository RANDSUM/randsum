/**
 * Base die class for creating custom dice
 */
export { D } from './D'

/**
 * Main function for rolling dice with various options
 */
export { roll } from './roll'

/**
 * Pre-configured dice ready for use
 *
 * @example
 * import { D20, coin } from '@randsum/dice'
 *
 * // Roll a D20
 * const result = D20.roll()
 *
 * // Flip a coin
 * const coinResult = coin.roll()
 */
export {
  /** A 62-sided die with all alphanumeric characters */
  alphaNumDie,
  /** A two-sided coin with "Heads" and "Tails" faces */
  coin,
  /** A ten-sided die (pentagonal trapezohedron) */
  D10,
  /** A percentile die (simulated with two D10s) */
  D100,
  /** A twelve-sided die (dodecahedron) */
  D12,
  /** A twenty-sided die (icosahedron) */
  D20,
  /** A four-sided die (tetrahedron) */
  D4,
  /** A six-sided die (cube) */
  D6,
  /** An eight-sided die (octahedron) */
  D8,
  /** Fudge/Fate dice with plus, minus, and blank faces */
  fudgeDice
} from './premadeDice'

/**
 * Core dice types for working with the dice system
 */
export type {
  /** Base interface for all dice */
  BaseD,
  /** Parameters for custom dice rolls */
  CustomRollParams,
  /** Result of rolling custom dice */
  CustomRollResult,
  /** Collection of dice to be rolled together */
  DicePool,
  /** Result of rolling mixed dice types */
  MixedRollResult,
  /** Parameters for numeric dice rolls */
  NumericRollParams,
  /** Result of rolling numeric dice */
  NumericRollResult,
  /** Argument types accepted by roll function */
  RollArgument,
  /** Options for configuring dice rolls */
  RollOptions,
  /** Combined parameters for all roll types */
  RollParams,
  /** Combined result type for all roll types */
  RollResult
} from './types'

/**
 * Core option types for configuring dice rolls
 */
export type {
  /** Base options for all roll types */
  BaseRollOptions,
  /** Options for comparing roll results */
  ComparisonOptions,
  /** Options specific to custom dice rolls */
  CustomRollOptions,
  /** Options for dropping highest or lowest dice */
  DropOptions,
  /** Combined modifier options for dice rolls */
  ModifierOptions,
  /** Bonus modifiers for numeric rolls */
  NumericRollBonus,
  /** Options specific to numeric dice rolls */
  NumericRollOptions,
  /** Options for replacing specific dice values */
  ReplaceOptions,
  /** Required parameters for numeric rolls */
  RequiredNumericRollParameters,
  /** Options for rerolling specific dice values */
  RerollOptions,
  /** Options for ensuring unique dice values */
  UniqueOptions
} from '@randsum/core'

/**
 * Dice notation types for parsing and validating dice expressions
 */
export type {
  /** Notation format for custom dice */
  CustomDiceNotation,
  /** Validation result for custom dice notation */
  CustomValidationResult,
  /** Base dice notation type */
  DiceNotation,
  /** Validation result for invalid dice notation */
  InvalidValidationResult,
  /** Notation format for numeric dice */
  NumericDiceNotation,
  /** Validation result for numeric dice notation */
  NumericValidationResult,
  /** Combined validation result type */
  ValidationResult
} from '@randsum/notation'
