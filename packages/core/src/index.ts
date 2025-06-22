/**
 * @file Core package exports for RANDSUM
 * @module @randsum/core
 *
 * This module provides the foundational types, utilities, and modifiers
 * used throughout the RANDSUM dice rolling ecosystem. It is primarily
 * intended for internal use by other @randsum packages.
 */

export { isNumericRollOptions } from './guards'

export { BaseModifier } from './modifiers/BaseModifier'
export { CapModifier } from './modifiers/CapModifier'
export { DropModifier } from './modifiers/DropModifier'
export { ExplodeModifier } from './modifiers/ExplodeModifier'
export { MinusModifier } from './modifiers/MinusModifier'
export { PlusModifier } from './modifiers/PlusModifier'
export { ReplaceModifier } from './modifiers/ReplaceModifier'
export { RerollModifier } from './modifiers/RerollModifier'
export { UniqueModifier } from './modifiers/UniqueModifier'

export { extractMatches } from './utils/extractMatches'
export { formatters } from './utils/formatters'
export { InvalidUniqueError } from './utils/invalidUniqueError'
export { optionsConverter } from './utils/optionsConverter'

// Enhanced error handling system
export { RandsumError, RandsumErrorCode, type ErrorContext } from './utils/randsumError'
export { InvalidNotationError } from './utils/invalidNotationError'
export { ModifierConflictError } from './utils/modifierConflictError'
export { RollConstraintError } from './utils/rollConstraintError'

export type * from './types'

