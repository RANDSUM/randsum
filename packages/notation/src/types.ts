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

export type ModifierConfig =
  | number
  | boolean
  | ComparisonOptions
  | DropOptions
  | KeepOptions
  | ReplaceOptions
  | ReplaceOptions[]
  | RerollOptions
  | UniqueOptions
  | SuccessCountOptions

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
  /** Multiply dice result (before +/- arithmetic) */
  multiply?: number
  /** Add a fixed value to the total */
  plus?: number
  /** Subtract a fixed value from the total */
  minus?: number
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
