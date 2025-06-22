/**
 * @file Dice notation parser and validator for RANDSUM
 * @module @randsum/notation
 *
 * This module provides functions for parsing, validating, and converting
 * dice notation strings into structured options objects. It supports
 * standard dice notation (e.g., "4d6L") and custom dice notation.
 */

export { isDiceNotation } from './isDiceNotation'
export { validateNotation } from './validateNotation'

export { completeRollPattern, coreNotationPattern } from './patterns'

export { notationToOptions } from './utils/notationToOptions'

export type * from './types'

export type * from '@randsum/core'

