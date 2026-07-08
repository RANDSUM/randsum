export interface ComparisonOptions {
  /** Threshold for "greater than" comparisons (strict: roll > N) */
  greaterThan?: number
  /** Threshold for "greater than or equal to" comparisons (roll >= N) */
  greaterThanOrEqual?: number
  /** Threshold for "less than" comparisons (strict: roll < N) */
  lessThan?: number
  /** Threshold for "less than or equal to" comparisons (roll <= N) */
  lessThanOrEqual?: number
  /** Exact values to match */
  exact?: number[]
}

export interface DropOptions extends ComparisonOptions {
  /** Number of highest dice to drop */
  highest?: number
  /** Number of lowest dice to drop */
  lowest?: number
}

export interface KeepOptions {
  /** Number of highest dice to keep */
  highest?: number
  /** Number of lowest dice to keep */
  lowest?: number
}

export interface RerollOptions extends ComparisonOptions {
  /** Maximum number of rerolls allowed */
  max?: number
}

export interface ReplaceOptions {
  /** Value or comparison to match for replacement */
  from: number | ComparisonOptions
  /** Value to replace matched rolls with */
  to: number
}

export interface UniqueOptions {
  /** Values that are allowed to repeat */
  notUnique: number[]
}

import type { ModifierSuffix } from './templateLiterals'

export interface CountOptions extends ComparisonOptions {
  /** If true, below-threshold count subtracts from above-threshold count */
  deduct?: boolean
}

export type ModifierConfig =
  | number
  | number[]
  | boolean
  | 'asc'
  | 'desc'
  | ComparisonOptions
  | CountOptions
  | DropOptions
  | KeepOptions
  | ReplaceOptions
  | ReplaceOptions[]
  | RerollOptions
  | UniqueOptions

export interface ModifierOptions {
  /** Cap roll values to a range */
  cap?: ComparisonOptions
  /** Drop dice from the result */
  drop?: DropOptions
  /** Keep dice from the result (complement to drop) */
  keep?: KeepOptions
  /** Replace specific values */
  replace?: ReplaceOptions | ReplaceOptions[]
  /** Reroll dice matching conditions */
  reroll?: RerollOptions
  /** Ensure unique values (true or options) */
  unique?: boolean | UniqueOptions
  /** Exploding dice: reroll and add on max value (single pass) */
  explode?: boolean | ComparisonOptions
  /** Compounding exploding: add to triggering die instead of creating new dice */
  compound?: boolean | number | ComparisonOptions
  /** Penetrating exploding: subtract 1 from each subsequent explosion */
  penetrate?: boolean | number | ComparisonOptions
  /** Count dice matching conditions instead of summing */
  count?: CountOptions
  /** Multiply dice result (before +/- arithmetic) */
  multiply?: number
  /** Add a fixed value to the total */
  plus?: number
  /** Subtract a fixed value from the total */
  minus?: number
  /** Sort the rolls array (display-only, does not affect total) */
  sort?: 'asc' | 'desc'
  /** Integer divide the total (truncates toward zero) */
  integerDivide?: number
  /** Modulo the total */
  modulo?: number
  /** Wild die: compound on max, remove wild + highest on 1 (D6 System) */
  wildDie?: boolean
  /** Multiply final total (after all other modifiers) */
  multiplyTotal?: number
  /** Explode through a sequence of die sizes */
  explodeSequence?: number[]
}

/**
 * The die-type of a parsed pool. `standard` covers ordinary NdS (and percentile,
 * which is d100); the remaining kinds are the special dice whose face semantics
 * must survive parsing.
 */
export type ParsedDieType =
  | 'standard'
  | 'percentile'
  | 'fate'
  | 'custom'
  | 'draw'
  | 'geometric'
  | 'zeroBias'

/**
 * The result of parsing a dice notation string.
 * Similar to RollOptions but with sides always numeric and
 * quantity/arithmetic always present.
 */
export interface ParsedNotationOptions {
  /** Number of dice to roll */
  quantity: number
  /** How this roll combines with others */
  arithmetic: 'add' | 'subtract'
  /** Number of sides on each die */
  sides: number
  /** Modifiers to apply to the roll */
  modifiers?: ModifierOptions
  /** Annotation label (e.g., [fire]) */
  label?: string
  /**
   * The die-type of this pool. Present for special dice (fate, custom faces,
   * draw, geometric, zero-bias, percentile) so their semantics are not lost when
   * a notation string is parsed to options; absent (or 'standard') for plain NdS.
   */
  dieType?: ParsedDieType
  /** Fate/Fudge variant: 1 (dF, -1..+1) or 2 (dF.2, -2..+2). Only for `dieType: 'fate'`. */
  fateVariant?: 1 | 2
  /** Raw custom face values (e.g. from `d{fire,ice}`). Only for `dieType: 'custom'`. */
  customFaces?: readonly string[]
}

/**
 * Template literal type for dice notation strings.
 *
 * The quantity is optional (`d20` is accepted as an alias for `1d20`, per
 * RDN §4.1), so the leading number may be omitted.
 */
export type DiceNotation = `${number | ''}${'d' | 'D'}${number}${ModifierSuffix}`

/**
 * Configuration options for a dice roll.
 *
 * @template T - Type for custom dice faces (defaults to string)
 */
export interface RollOptions<T = string> {
  /** Number of dice to roll (default: 1) */
  quantity?: number
  /** How this roll combines with others: 'add' or 'subtract' (default: 'add') */
  arithmetic?: 'add' | 'subtract'
  /** Number of sides, or array of custom face values */
  sides: number | T[]
  /** Modifiers to apply to the roll (drop, reroll, explode, etc.) */
  modifiers?: ModifierOptions
  /**
   * Optional identifier for this roll in multi-roll expressions.
   * Default keys are auto-generated as "Roll 1", "Roll 2", etc.
   */
  key?: string | undefined
  /**
   * Optional annotation label for this roll (e.g. `"fire"` from `2d6[fire]`).
   * Carried through to the roll record; does not affect the numeric result.
   */
  label?: string | undefined
}

/**
 * Successful validation result.
 */
export interface ValidValidationResult {
  /** Indicates successful validation */
  valid: true
  /** Original input as DiceNotation */
  argument: DiceNotation
  /** Human-readable descriptions for each roll */
  description: string[][]
  /** Parsed roll options for each roll */
  options: ParsedNotationOptions[]
  /** Notation strings for each roll */
  notation: DiceNotation[]
  /** No error on success */
  error: null
}

/**
 * Error information from validation.
 */
export interface ValidationErrorInfo {
  /** Description of what's wrong */
  message: string
  /** The input that failed validation */
  argument: string
  /**
   * Zero-based character offset where parsing failed (the position of the first
   * unexpected/invalid token). Populated by the single-pass parser.
   */
  position?: number
}

/**
 * Failed validation result.
 */
export interface InvalidValidationResult {
  /** Indicates failed validation */
  valid: false
  /** Original input string */
  argument: string
  /** Error information */
  error: ValidationErrorInfo
}

/**
 * Result of notation validation.
 */
export type ValidationResult = ValidValidationResult | InvalidValidationResult
