import type {
  CustomRollParams,
  NumericRollParams,
  RollParams
} from './parameters'
import type { ModifierLog } from './modifiers'
import type { CustomRollOptions } from './options'

export interface RollHistory<P extends RollParams = RollParams> {
  modifiedRolls: P['options'] extends CustomRollOptions ? string[] : number[]
  total: P['options'] extends CustomRollOptions ? string : number
  initialRolls: P['options'] extends CustomRollOptions ? string[] : number[]
  logs: ModifierLog[]
}

export interface BaseRollResult<P extends RollParams = RollParams> {
  parameters: P
  description: P['description']
  die: P['die']
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

export interface MeetOrBeatResult {
  success: boolean
  target: number
  result: NumericRollResult
}
