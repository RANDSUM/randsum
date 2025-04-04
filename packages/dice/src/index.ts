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
  alphaNumDie,
  coin,
  D10,
  D100,
  D12,
  D20,
  D4,
  D6,
  D8,
  fudgeDice
} from './premadeDice'

/**
 * Type exports organized by category for better tree-shaking
 *
 * Types are grouped by their purpose to make it easier for bundlers
 * to eliminate unused types and reduce bundle size.
 */

// Core dice types from this package
export type {
  BaseD,
  CustomRollParams,
  CustomRollResult,
  DicePool,
  MixedRollResult,
  NumericRollParams,
  NumericRollResult,
  RollArgument,
  RollOptions,
  RollParams,
  RollResult
} from './types'

export type {
  BaseRollOptions,
  ComparisonOptions,
  CustomRollOptions,
  DropOptions,
  ModifierOptions,
  NumericRollOptions,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '@randsum/core'

export type {
  CustomDiceNotation,
  CustomValidationResult,
  DiceNotation,
  InvalidValidationResult,
  NumericDiceNotation,
  NumericValidationResult,
  ValidationResult
} from '@randsum/notation'
