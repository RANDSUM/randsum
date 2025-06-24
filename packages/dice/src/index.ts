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
export * from './D'

/**
 * Main dice rolling function
 *
 * The primary function for rolling dice with support for multiple
 * argument types, modifiers, and complex roll configurations.
 */
export { roll } from './roll'

/**
 * Type guards for roll result discrimination
 *
 * These functions provide runtime type checking for roll results,
 * enabling type-safe filtering and processing of different result types.
 */
export * from './guards/isRollResult'

/**
 * Core types from @randsum/core package
 *
 * Contains all modifier options, roll configurations, and base interfaces
 * used throughout the RANDSUM ecosystem.
 */
export type * from '@randsum/core'

/**
 * Notation types from @randsum/notation package
 *
 * Contains dice notation string types, validation results, and parsing
 * utilities for working with dice notation strings.
 */
export type * from '@randsum/notation'

/**
 * Result types from @randsum/dice package
 *
 * Contains all roll result interfaces, dice pool types, and argument types
 * for working with dice rolling results and configurations.
 */
export type * from './types'
