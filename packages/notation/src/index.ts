/**
 * @file Dice notation parser and validator for RANDSUM
 * @module @randsum/notation
 *
 * This module provides functions for parsing, validating, and converting
 * dice notation strings into structured options objects. It supports
 * standard dice notation (e.g., "4d6L") and custom dice notation.
 */

// Core validation and parsing functions
export { isDiceNotation } from './isDiceNotation'
export { validateNotation } from './validateNotation'

// Regular expression patterns for notation parsing
export { completeRollPattern, coreNotationPattern } from './patterns'

// Utility functions for notation conversion
export { notationToOptions } from './utils/notationToOptions'

// Type definitions for validation results
export type {
  CustomValidationResult,
  InvalidValidationResult,
  NumericValidationResult,
  ValidationResult
} from './types'

// Re-exported types from core package for convenience
export type {
  BaseRollOptions,
  ComparisonOptions,
  CustomDiceNotation,
  CustomRollOptions,
  DiceNotation,
  DropOptions,
  ModifierOptions,
  NumericDiceNotation,
  NumericRollOptions,
  ReplaceOptions,
  RerollOptions,
  RollOptions,
  UniqueOptions
} from '@randsum/core'

