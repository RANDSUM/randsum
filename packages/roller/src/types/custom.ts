import type { RollResult } from './roll'
export interface CustomRollResult<TResult = string, TRollResult = RollResult> {
  result: TResult
  rolls: TRollResult[]
}
