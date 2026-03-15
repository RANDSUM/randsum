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

export interface SuccessCountOptions {
  /** Threshold for counting successes (rolls >= this value) */
  threshold: number
  /** Optional: threshold for counting botches/failures (rolls <= this value) */
  botchThreshold?: number
}

export interface FailureCountOptions {
  /** Threshold for counting failures (rolls <= this value) */
  threshold: number
}

export type ModifierConfig =
  | number
  | boolean
  | 'asc'
  | 'desc'
  | ComparisonOptions
  | DropOptions
  | KeepOptions
  | ReplaceOptions
  | ReplaceOptions[]
  | RerollOptions
  | UniqueOptions
  | SuccessCountOptions
  | FailureCountOptions

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
  /** Exploding dice: reroll and add on max value */
  explode?: boolean | number
  /** Compounding exploding: add to triggering die instead of creating new dice */
  compound?: boolean | number
  /** Penetrating exploding: subtract 1 from each subsequent explosion */
  penetrate?: boolean | number
  /** Count successes instead of summing (for dice pool systems) */
  countSuccesses?: SuccessCountOptions
  /** Count failures (dice at or below threshold) */
  countFailures?: FailureCountOptions
  /** Multiply dice result (before +/- arithmetic) */
  multiply?: number
  /** Add a fixed value to the total */
  plus?: number
  /** Subtract a fixed value from the total */
  minus?: number
  /** Sort the rolls array (display-only, does not affect total) */
  sort?: 'asc' | 'desc'
  /** Multiply final total (after all other modifiers) */
  multiplyTotal?: number
}

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
}

/**
 * Template literal type for dice notation strings.
 */
export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`

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
