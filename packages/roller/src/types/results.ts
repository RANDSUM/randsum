// ============================================================================
// Result Types - Types for roll results and records
// ============================================================================

import type { DiceNotation, RollArgument, RollOptions } from './core'
import type { NumericRollBonus } from './modifiers'

/**
 * Fully resolved parameters for a single roll.
 *
 * Contains all information needed to execute and describe the roll.
 *
 * @template T - Type for custom dice faces
 */
export interface RollParams<T = string> extends Required<Omit<RollOptions<T>, 'sides'>> {
  /** Numeric sides (always resolved to number) */
  sides: number
  /** Custom face values if using non-numeric dice */
  faces?: T[]
  /** Original input argument */
  argument: RollArgument<T>
  /** Human-readable description of the roll */
  description: string[]
  /** Dice notation string */
  notation: DiceNotation
}

/**
 * Complete record of a single roll execution.
 *
 * Contains the input parameters, raw rolls, modifier history,
 * and final computed results.
 *
 * @template T - Type for custom dice faces
 */
export interface RollRecord<T = string> {
  /** Human-readable description */
  description: RollParams<T>['description']
  /** Full roll parameters */
  parameters: RollParams<T>
  /** Raw die results before modifiers */
  rolls: number[]
  /** History of modifier applications */
  modifierHistory: {
    /** Logs from each modifier */
    logs: NumericRollBonus['logs']
    /** Rolls after all modifiers */
    modifiedRolls: number[]
    /** Total after modifiers */
    total: number
    /** Original rolls before modifiers */
    initialRolls: number[]
  }
  /** Total including arithmetic modifiers */
  appliedTotal: number
  /** Custom face results (for non-numeric dice) */
  customResults?: T[]
  /** Final total for this roll */
  total: number
}

/**
 * Generic roll result container.
 *
 * @template TResult - Type of the overall result
 * @template TRollRecord - Type of individual roll records
 */
export interface RollResult<TResult = number, TRollRecord = RollRecord> {
  /** Individual roll records */
  rolls: TRollRecord[]
  /** Aggregate result */
  result: TResult
}

/**
 * Result from the roll() function.
 *
 * Contains all roll records, individual results, and the combined total.
 *
 * @template T - Type for custom dice faces
 *
 * @example
 * ```ts
 * const result: RollerRollResult = roll("4d6L")
 * console.log(result.total)   // Sum of kept dice
 * console.log(result.result)  // Array of individual die values
 * console.log(result.rolls)   // Full roll records with history
 * ```
 */
export interface RollerRollResult<T = string> extends RollResult<T[], RollRecord<T>> {
  /** Combined total of all rolls */
  total: number
}
