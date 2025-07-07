import type {
  CustomRollParams,
  NumericRollParams,
  RollParams
} from './parameters'
import type { ModifierLog } from './modifiers'
import type { CustomRollOptions } from './options'

interface ModifiedRolls<T extends RollParams = RollParams> {
  rolls: T['options'] extends CustomRollOptions ? string[] : number[]
  total: T['options'] extends CustomRollOptions ? string : number
  rawRolls: T['options'] extends CustomRollOptions ? string[] : number[]
  logs: ModifierLog[]
}

export interface BaseRollResult<P extends RollParams = RollParams> {
  parameters: P
  type: 'numeric' | 'custom'
  rawRolls: number[] | string[]
  modifiedRolls: ModifiedRolls<P>
  total: string | number
}

export interface NumericRollResult extends BaseRollResult<NumericRollParams> {
  type: 'numeric'
  rawRolls: number[]
  modifiedRolls: ModifiedRolls<NumericRollParams>
  total: number
}

export interface CustomRollResult extends BaseRollResult<CustomRollParams> {
  type: 'custom'
  rawRolls: string[]
  modifiedRolls: ModifiedRolls<CustomRollParams>
  total: string
}

export type RollResult = NumericRollResult | CustomRollResult
