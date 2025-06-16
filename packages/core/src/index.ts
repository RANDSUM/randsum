/**
 * @file Core package exports for RANDSUM
 * @module @randsum/core
 *
 * This module provides the foundational types, utilities, and modifiers
 * used throughout the RANDSUM dice rolling ecosystem. It is primarily
 * intended for internal use by other @randsum packages.
 */

// Guards and type checking utilities
export { isNumericRollOptions } from './guards'

// Modifier classes for dice roll modifications
export { BaseModifier } from './modifiers/BaseModifier'
export { CapModifier } from './modifiers/CapModifier'
export { DropModifier } from './modifiers/DropModifier'
export { ExplodeModifier } from './modifiers/ExplodeModifier'
export { MinusModifier } from './modifiers/MinusModifier'
export { PlusModifier } from './modifiers/PlusModifier'
export { ReplaceModifier } from './modifiers/ReplaceModifier'
export { RerollModifier } from './modifiers/RerollModifier'
export { UniqueModifier } from './modifiers/UniqueModifier'
// Core type definitions for dice rolling
export type {
  BaseRollOptions,
  ComparisonOptions,
  CustomDiceNotation,
  CustomRollOptions,
  DiceNotation,
  DropOptions,
  ModifierOptions,
  NumericDiceNotation,
  NumericRollBonus,
  NumericRollOptions,
  ReplaceOptions,
  RequiredNumericRollParameters,
  RerollOptions,
  RollOptions,
  UniqueOptions
} from './types'

// Utility functions and helpers
export { extractMatches } from './utils/extractMatches'
export { formatters } from './utils/formatters'
export { InvalidUniqueError } from './utils/invalidUniqueError'
export { optionsConverter } from './utils/optionsConverter'

