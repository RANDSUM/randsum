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
  readonly type: 'numeric'
  readonly sides: number
  readonly faces: number[]
  readonly isCustom: false
  roll(quantity?: number): number
  rollSpread(quantity?: number): number[]
  rollModified(quantity: number, modifiers?: ModifierOptions): NumericRollResult
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
  rollModified(quantity: number, modifiers?: ModifierOptions): CustomRollResult
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

interface BaseRollParams<A extends RollArgument = RollArgument> {
  description: string[]
  argument: A
}

export interface NumericRollParams extends BaseRollParams<NumericRollArgument> {
  options: NumericRollOptions
  die: NumericDie
  notation: NumericDiceNotation
}

export interface CustomRollParams extends BaseRollParams<CustomRollArgument> {
  options: CustomRollOptions
  die: CustomDie
  notation: CustomDiceNotation
}

export type RollParams = NumericRollParams | CustomRollParams

// -----------------------
// --- ROLL RESULTS ---
// -----------------------

export interface BaseSingleRollResult<P extends RollParams = RollParams> {
  parameters: P
  rawResult: number | string
  type: 'numeric' | 'custom'
  rawRolls: number[] | string[]
  modifiedRolls: { rolls: string[] | number[]; total: string | number }
  total: string | number
}

export interface SingleNumericRollResult
  extends BaseSingleRollResult<NumericRollParams> {
  type: 'numeric'
  rawResult: number
  rawRolls: number[]
  modifiedRolls: { rolls: number[]; total: number }
  total: number
}

export interface SingleCustomRollResult
  extends BaseSingleRollResult<CustomRollParams> {
  type: 'custom'
  rawResult: string
  rawRolls: string[]
  modifiedRolls: { rolls: string[]; total: string }
  total: string
}

interface BaseRollResult<P extends RollParams = RollParams> {
  parameters: P[]
  rolls: (SingleNumericRollResult | SingleCustomRollResult)[]
  rawResults: (string | number)[]
  total: string | number
  type: 'numeric' | 'custom' | 'mixed'
}

export interface NumericRollResult extends BaseRollResult<NumericRollParams> {
  type: 'numeric'
  rolls: SingleNumericRollResult[]
  rawResults: number[]
  total: number
}

export interface CustomRollResult extends BaseRollResult<CustomRollParams> {
  type: 'custom'
  rolls: SingleCustomRollResult[]
  rawResults: string[]
  total: string
}

export interface MixedRollResult extends BaseRollResult {
  type: 'mixed'
  rolls: (SingleNumericRollResult | SingleCustomRollResult)[]
  rawResults: (string | number)[]
  total: string
}

export type SingleRollResult = SingleNumericRollResult | SingleCustomRollResult
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
