/**
 * @file Core utility functions for RANDSUM
 * @module @randsum/core/utils
 *
 * This module exports utility functions used across the RANDSUM ecosystem
 * for pattern matching, formatting, error handling, and options conversion.
 */

export { extractMatches } from './extractMatches'
export { formatters } from './formatters'
export { InvalidUniqueError } from './invalidUniqueError'
export { optionsConverter } from './optionsConverter'

// Enhanced error handling system
export { RandsumError, RandsumErrorCode, type ErrorContext } from './randsumError'
export { InvalidNotationError } from './invalidNotationError'
export { ModifierConflictError } from './modifierConflictError'
export { RollConstraintError } from './rollConstraintError'

