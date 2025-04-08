import type {
  CustomRollOptions,
  ModifierOptions,
  NumericRollOptions
} from '@randsum/core'

import type { CustomDiceNotation, NumericDiceNotation } from '@randsum/notation'

// -----------------------
// --- DIE TYPES ---
// -----------------------

export interface BaseD<T extends number | string[]> {
  readonly sides: number
  readonly faces: T extends number ? number[] : string[]
  readonly type: T extends number ? 'numerical' : 'custom'
  readonly isCustom: T extends number ? false : true
  roll: (quantity?: number) => T extends number ? number : string
  rollSpread: (quantity?: number) => T extends number ? number[] : string[]
  rollModified: (
    quantity: number,
    modifiers?: ModifierOptions
  ) => T extends number ? NumericRollResult : CustomRollResult
  toOptions: T extends number ? NumericRollOptions : CustomRollOptions
}

// -----------------------
// --- ROLL ARGUMENTS ---
// -----------------------

export type NumericRollArgument =
  | BaseD<number>
  | NumericRollOptions
  | NumericDiceNotation
  | number
  | `${number}`

export type CustomRollArgument =
  | BaseD<string[]>
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
  die: BaseD<number>
  notation: NumericDiceNotation
}

export interface CustomRollParams extends BaseRollParams {
  argument: CustomRollArgument
  options: CustomRollOptions
  die: BaseD<string[]>
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
