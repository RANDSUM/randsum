import type { ModifierOptions } from './modifiers'
import type { CustomRollOptions, NumericRollOptions } from './options'
import type { CustomRollResult, NumericRollResult } from './results'
import type { CustomDiceNotation, NumericDiceNotation } from './notation'

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

export type BaseD = NumericDie | CustomDie

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
