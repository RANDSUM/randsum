import type {
  CustomRollOptions,
  ModifierOptions,
  NumericRollOptions
} from '@randsum/core'

import type { CustomDiceNotation, NumericDiceNotation } from '@randsum/notation'

// -----------------------
// --- DIE TYPES ---
// -----------------------

/**
 * Interface for numeric dice (standard numbered dice like d6, d20, etc.)
 */
export interface NumericDie {
  readonly type: 'numerical'
  readonly sides: number
  readonly faces: number[]
  readonly isCustom: false
  roll(quantity?: number): number
  rollSpread(quantity?: number): number[]
  rollModified(
    quantity: number,
    modifiers?: ModifierOptions
  ): NumericRollResult
  toOptions: NumericRollOptions
}

/**
 * Interface for custom dice (dice with string faces like coins, color dice, etc.)
 */
export interface CustomDie {
  readonly type: 'custom'
  readonly sides: number
  readonly faces: string[]
  readonly isCustom: true
  roll(quantity?: number): string
  rollSpread(quantity?: number): string[]
  rollModified(
    quantity: number,
    modifiers?: ModifierOptions
  ): CustomRollResult
  toOptions: CustomRollOptions
}

/**
 * Union type representing any die (numeric or custom)
 */
export type BaseD = NumericDie | CustomDie

// -----------------------
// --- ROLL ARGUMENTS ---
// -----------------------

export type NumericRollArgument =
  | NumericDie
  | NumericRollOptions
  | NumericDiceNotation
  | number
  | `${number}`

export type CustomRollArgument =
  | CustomDie
  | CustomRollOptions
  | CustomDiceNotation
  | string[]

export type RollArgument = NumericRollArgument | CustomRollArgument

// -----------------------
// --- ROLL PARAMETERS ---
// -----------------------

interface BaseRollParams {
  description: string[]
}

export interface NumericRollParams extends BaseRollParams {
  argument: NumericRollArgument
  options: NumericRollOptions
  die: NumericDie
  notation: NumericDiceNotation
}

export interface CustomRollParams extends BaseRollParams {
  argument: CustomRollArgument
  options: CustomRollOptions
  die: CustomDie
  notation: CustomDiceNotation
}

export type RollParams = NumericRollParams | CustomRollParams

export interface DicePool<P extends RollParams = RollParams> {
  dicePools: Record<string, P>
}

// -----------------------
// --- ROLL RESULTS ---
// -----------------------

interface BaseRollResult<P extends RollParams = RollParams>
  extends DicePool<P> {
  rawResult: (number | string)[]
  type: 'numerical' | 'custom' | 'mixed'
  rawRolls: Record<string, number[] | string[]>
  modifiedRolls: Record<
    string,
    { rolls: string[] | number[]; total: string | number }
  >
  result: (string | number)[]
  total: string | number
}

export interface NumericRollResult extends BaseRollResult<NumericRollParams> {
  type: 'numerical'
  rawRolls: Record<string, number[]>
  rawResult: number[]
  modifiedRolls: Record<string, { rolls: number[]; total: number }>
  result: number[]
  total: number
}

export interface CustomRollResult extends BaseRollResult<CustomRollParams> {
  type: 'custom'
  rawRolls: Record<string, string[]>
  rawResult: string[]
  modifiedRolls: Record<string, { rolls: string[]; total: string }>
  result: string[]
  total: string
}

export interface MixedRollResult extends BaseRollResult {
  type: 'mixed'
  rawRolls: Record<string, number[] | string[]>
  modifiedRolls: Record<
    string,
    { rolls: string[] | number[]; total: string | number }
  >
  result: (string | number)[]
  total: string
}

export type RollResult = NumericRollResult | CustomRollResult | MixedRollResult

export type {
  ComparisonOptions,
  CustomRollOptions,
  DropOptions,
  ModifierOptions,
  NumericRollBonus,
  NumericRollOptions,
  ReplaceOptions,
  RerollOptions,
  RollOptions,
  UniqueOptions
} from '@randsum/core'

export type {
  CustomDiceNotation,
  DiceNotation,
  NumericDiceNotation
} from '@randsum/notation'
