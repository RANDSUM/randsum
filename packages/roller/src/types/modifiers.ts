import type { ModifierConfig as _ModifierConfig } from '@randsum/notation'

// Re-export modifier option types from notation for backward compatibility
export type {
  ComparisonOptions,
  CountOptions,
  DropOptions,
  KeepOptions,
  RerollOptions,
  ReplaceOptions,
  UniqueOptions,
  ModifierConfig,
  ModifierOptions
} from '@randsum/notation'

/**
 * Record of a single modifier's effect on the dice pool.
 *
 * `added` and `removed` represent the frequency difference between
 * the dice pool before and after this modifier ran — values that
 * appear more frequently in the new pool go to `added`, less frequently to `removed`.
 *
 * @example
 * ```ts
 * // Roll [3, 5, 2, 6], drop lowest 1 (removes 2):
 * // log = { modifier: 'drop', options: { lowest: 1 }, added: [], removed: [2] }
 *
 * // Roll [1, 4, 4, 6], reroll 1 (becomes 3):
 * // log = { modifier: 'reroll', options: {...}, added: [3], removed: [1] }
 *
 * // Roll [2, 4, 6], explode on 6 (adds a 5):
 * // log = { modifier: 'explode', options: true, added: [5], removed: [] }
 * ```
 */
export interface ModifierLog {
  /** Name of the modifier that was applied */
  modifier: string
  /** Configuration used for this modifier */
  options: _ModifierConfig | undefined
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
  /** History of modifier applications */
  logs: ModifierLog[]
}
