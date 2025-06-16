/**
 * @file Regular expression patterns for dice notation parsing
 * @module @randsum/notation/patterns
 *
 * This module exports regular expression patterns used to parse and validate
 * dice notation strings. The patterns are constructed from modifier patterns
 * defined in the core package to ensure consistency across the system.
 */

import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '@randsum/core'

/**
 * Regular expression pattern for core dice notation
 *
 * Matches the basic dice specification part of notation strings,
 * including quantity, 'd' separator, and sides (numeric or custom faces).
 *
 * @example
 * // Matches these patterns:
 * // "4d6" - 4 six-sided dice
 * // "2d20" - 2 twenty-sided dice
 * // "3d{H,T}" - 3 custom dice with H and T faces
 */
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const coreNotationPattern: RegExp = /^\d+[Dd](\d+|{.*})/

/**
 * Complete regular expression pattern for full dice notation validation
 *
 * This pattern combines the core notation pattern with all possible
 * modifier patterns to validate complete dice notation strings.
 * It's used to ensure that notation strings contain only valid
 * components and no extraneous characters.
 *
 * @example
 * // Validates complete notation strings like:
 * // "4d6L!+2" - 4d6, drop lowest, explode, plus 2
 * // "2d20H" - 2d20, keep highest (advantage)
 * // "3d8R{<3}" - 3d8, reroll less than 3
 */
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const completeRollPattern: RegExp = new RegExp(
  [
    coreNotationPattern.source,
    DropModifier.highestPattern.source,
    DropModifier.lowestPattern.source,
    DropModifier.constraintsPattern.source,
    ExplodeModifier.pattern.source,
    UniqueModifier.pattern.source,
    ReplaceModifier.pattern.source,
    RerollModifier.pattern.source,
    CapModifier.pattern.source,
    PlusModifier.pattern.source,
    MinusModifier.pattern.source
  ].join('|'),
  'g'
)
