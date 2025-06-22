/**
 * @file Core dice rolling functionality for RANDSUM
 * @module @randsum/dice
 *
 * This is the main package for dice rolling in the RANDSUM ecosystem.
 * It provides the core `roll` function, die classes, and type definitions
 * for creating flexible and type-safe dice rolling applications.
 */

/**
 * Die classes and pre-configured dice instances
 *
 * These exports include the base `D` class for creating custom dice,
 * standard gaming dice (D4, D6, D8, D10, D12, D20, D100), and
 * specialized dice like coins and Fudge dice.
 */
export {
  D,
  D10,
  D100,
  D12,
  D20,
  D4,
  D6,
  D8, alphaNumDie,
  coin, fudgeDice
} from './D'

/**
 * Main dice rolling function
 *
 * The primary function for rolling dice with support for multiple
 * argument types, modifiers, and complex roll configurations.
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
  BaseD,
  CustomDie,
  CustomRollArgument,
  CustomRollParams,
  CustomRollResult,
  DicePool,
  MixedRollResult,
  NumericDie,
  NumericRollArgument,
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

