/**
 * Options for comparison-based operations (greater/less than).
 *
 * Used by cap, drop, reroll, and replace modifiers.
 *
 * @example
 * ```ts
 * // Cap rolls to max 18
 * { greaterThan: 18 }
 *
 * // Drop rolls below 3
 * { lessThan: 3 }
 * ```
 */
export interface ComparisonOptions {
  /** Threshold for "greater than" comparisons */
  greaterThan?: number
  /** Threshold for "less than" comparisons */
  lessThan?: number
}

/**
 * Options for the drop modifier.
 *
 * Specifies which dice to remove from the roll result.
 *
 * @example
 * ```ts
 * // D&D ability score: 4d6 drop lowest
 * { lowest: 1 }
 *
 * // Advantage: 2d20 drop lowest (keep highest)
 * { lowest: 1 }
 *
 * // Drop all 1s and 2s
 * { exact: [1, 2] }
 * ```
 */
export interface DropOptions extends ComparisonOptions {
  /** Number of highest dice to drop */
  highest?: number
  /** Number of lowest dice to drop */
  lowest?: number
  /** Specific values to drop */
  exact?: number[]
}

/**
 * Options for the keep modifier.
 *
 * Specifies which dice to keep from the roll result.
 * This is the complement to drop - keeping N highest is equivalent to dropping (quantity - N) lowest.
 *
 * @example
 * ```ts
 * // Keep 3 highest from 4d6 (equivalent to drop lowest)
 * { highest: 3 }
 *
 * // Keep 2 lowest
 * { lowest: 2 }
 * ```
 */
export interface KeepOptions {
  /** Number of highest dice to keep */
  highest?: number
  /** Number of lowest dice to keep */
  lowest?: number
}

/**
 * Options for the reroll modifier.
 *
 * Specifies conditions for rerolling dice.
 *
 * @example
 * ```ts
 * // Reroll 1s
 * { exact: [1] }
 *
 * // Reroll values below 3, max 2 rerolls
 * { lessThan: 3, max: 2 }
 * ```
 */
export interface RerollOptions extends ComparisonOptions {
  /** Specific values to reroll */
  exact?: number[]
  /** Maximum number of rerolls allowed */
  max?: number
}

/**
 * Options for the replace modifier.
 *
 * Specifies value replacements to apply.
 *
 * @example
 * ```ts
 * // Replace 1s with 2s
 * { from: 1, to: 2 }
 *
 * // Replace values greater than 5 with 5
 * { from: { greaterThan: 5 }, to: 5 }
 * ```
 */
export interface ReplaceOptions {
  /** Value or comparison to match for replacement */
  from: number | ComparisonOptions
  /** Value to replace matched rolls with */
  to: number
}

/**
 * Options for the unique modifier.
 *
 * Ensures all dice show different values.
 *
 * @example
 * ```ts
 * // Allow 1s to repeat, all others unique
 * { notUnique: [1] }
 * ```
 */
export interface UniqueOptions {
  /** Values that are allowed to repeat */
  notUnique: number[]
}

/**
 * Options for success counting (dice pool systems like World of Darkness, Shadowrun).
 *
 * Counts how many dice meet a threshold, rather than summing their values.
 *
 * @example
 * ```ts
 * // World of Darkness: count successes >= 8
 * { threshold: 8 }
 *
 * // Shadowrun: count successes >= 5
 * { threshold: 5 }
 * ```
 */
export interface SuccessCountOptions {
  /** Threshold for counting successes (rolls >= this value) */
  threshold: number
  /** Optional: threshold for counting botches/failures (rolls <= this value) */
  botchThreshold?: number
}

/**
 * Union type of all possible modifier configuration values.
 */
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

/**
 * All available dice roll modifiers.
 *
 * Modifiers are applied in order: reroll → explode → replace → drop → cap → arithmetic
 *
 * @example
 * ```ts
 * const modifiers: ModifierOptions = {
 *   drop: { lowest: 1 },      // Drop lowest die
 *   reroll: { exact: [1] },   // Reroll 1s
 *   plus: 5                   // Add 5 to total
 * }
 * ```
 */
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
  /**
   * Exploding dice: reroll and add on max value.
   * - true: explode once per die (backward compatible)
   * - number: max explosion depth (0 = unlimited, capped at 100 for safety)
   */
  explode?: boolean | number
  /**
   * Compounding exploding: add to triggering die instead of creating new dice.
   * - true: compound once per die (backward compatible)
   * - number: max compound depth (0 = unlimited, capped at 100 for safety)
   */
  compound?: boolean | number
  /**
   * Penetrating exploding: subtract 1 from each subsequent explosion.
   * - true: penetrate once per die (backward compatible)
   * - number: max penetrate depth (0 = unlimited, capped at 100 for safety)
   */
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
 * Log entry for a single modifier application.
 *
 * Records what changed when a modifier was applied.
 */
export interface ModifierLog {
  /** Name of the modifier that was applied */
  modifier: string
  /** Configuration used for this modifier */
  options: ModifierConfig | undefined
  /** Values that were added by this modifier */
  added: number[]
  /** Values that were removed by this modifier */
  removed: number[]
}

/**
 * Intermediate state during modifier processing.
 */
export interface NumericRollBonus {
  /** Current roll values */
  rolls: number[]
  /** Arithmetic modifier (+/-) to apply to total */
  simpleMathModifier: number
  /** History of modifier applications */
  logs: ModifierLog[]
}
