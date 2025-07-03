import type {
  CustomRollArgument,
  NumericRollArgument,
  RollArgument
} from './dice'
import type { CustomRollOptions, NumericRollOptions } from './options'
import type { CustomDie, NumericDie } from './dice'
import type { CustomDiceNotation, NumericDiceNotation } from './notation'

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
