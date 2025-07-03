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
  logs: ModifierLog[]
}

export interface BaseRollPoolResult<P extends RollParams = RollParams> {
  parameters: P
  rawResult: number | string
  type: 'numeric' | 'custom'
  rawRolls: number[] | string[]
  modifiedRolls: ModifiedRolls<P>
  total: string | number
}

export interface NumericRollPoolResult
  extends BaseRollPoolResult<NumericRollParams> {
  type: 'numeric'
  rawResult: number
  rawRolls: number[]
  modifiedRolls: ModifiedRolls<NumericRollParams>
  total: number
}

export interface CustomRollPoolResult
  extends BaseRollPoolResult<CustomRollParams> {
  type: 'custom'
  rawResult: string
  rawRolls: string[]
  modifiedRolls: ModifiedRolls<CustomRollParams>
  total: string
}

interface BaseRollResult {
  rolls: (NumericRollPoolResult | CustomRollPoolResult)[]
  rawResults: (string | number)[]
  total: string | number
  type: 'numeric' | 'custom' | 'mixed'
}

export interface NumericRollResult extends BaseRollResult {
  type: 'numeric'
  rolls: NumericRollPoolResult[]
  rawResults: number[]
  total: number
}

export interface CustomRollResult extends BaseRollResult {
  type: 'custom'
  rolls: CustomRollPoolResult[]
  rawResults: string[]
  total: string
}

export interface MixedRollResult extends BaseRollResult {
  type: 'mixed'
  rolls: (NumericRollPoolResult | CustomRollPoolResult)[]
  rawResults: (string | number)[]
  total: string
}

export type RollPoolResult = NumericRollPoolResult | CustomRollPoolResult

export type RollResult = NumericRollResult | CustomRollResult | MixedRollResult
