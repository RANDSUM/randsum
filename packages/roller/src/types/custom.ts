import type { RollResult } from './roll'
export interface CustomRollResult<TOutcome = string, TRollResult = RollResult> {
  result: TOutcome
  rolls: TRollResult[]
}
