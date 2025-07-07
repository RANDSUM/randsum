import type {
  CustomRollParams,
  NumericRollParams,
  RollParams
} from './parameters'
import type { ModifierLog } from './modifiers'
import type { CustomRollOptions } from './options'

export interface RollHistory<T extends RollParams = RollParams> {
  modifiedRolls: T['options'] extends CustomRollOptions ? string[] : number[]
  total: T['options'] extends CustomRollOptions ? string : number
  initialRolls: T['options'] extends CustomRollOptions ? string[] : number[]
  logs: ModifierLog[]
}

export interface BaseRollResult<P extends RollParams = RollParams> {
  parameters: P
  type: 'numeric' | 'custom'
  rolls: RollHistory<P>['modifiedRolls']
  history: RollHistory<P>
  total: string | number
}

export interface NumericRollResult extends BaseRollResult<NumericRollParams> {
  type: 'numeric'
  rolls: number[]
  history: RollHistory<NumericRollParams>
  total: number
}

export interface CustomRollResult extends BaseRollResult<CustomRollParams> {
  type: 'custom'
  rolls: string[]
  history: RollHistory<CustomRollParams>
  total: string
}

export type RollResult = NumericRollResult | CustomRollResult
