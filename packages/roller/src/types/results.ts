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
  /** Original input argument */
  argument: RollParams<T>['argument']
  /** Dice notation string */
  notation: RollParams<T>['notation']
  /** Human-readable description */
  description: RollParams<T>['description']
  /** Full roll parameters */
  parameters: RollParams<T>
  /** Die results after modifiers */
  rolls: number[]
  /** Original rolls before modifiers */
  initialRolls: number[]
  /** Logs from each modifier application */
  modifierLogs: NumericRollBonus['logs']
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
 * @template TValues - Type of the overall values
 * @template TRollRecord - Type of individual roll records
 */
export interface RollResult<TValues = number, TRollRecord = RollRecord> {
  /** Individual roll records */
  rolls: TRollRecord[]
  /** Aggregate values */
  values: TValues
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
 * const result = roll("4d6L")
 * result.total   // => Sum of kept dice
 * result.values  // => Array of individual die values
 * result.rolls   // => Full roll records with history
 * ```
 */
export interface RollerRollResult<T = string> extends RollResult<T[], RollRecord<T>> {
  /** Combined total of all rolls */
  total: number
}
