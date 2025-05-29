/**
 * Base die class for creating custom dice
 */
export {
  alphaNumDie,
  coin,
  D,
  D10,
  D100,
  D12,
  D20,
  D4,
  D6,
  D8,
  fudgeDice
} from './D'

/**
 * Main function for rolling dice with various options
 */
export { roll } from './roll'

/**
 * Type exports organized by category for better tree-shaking
 *
 * Types are grouped by their purpose to make it easier for bundlers
 * to eliminate unused types and reduce bundle size.
 */

// Core dice types from this package
export type {
  BaseD, CustomRollArgument, CustomRollParams,
  CustomRollResult, DicePool,
  MixedRollResult, NumericRollArgument, NumericRollParams,
  NumericRollResult, RollArgument,
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
