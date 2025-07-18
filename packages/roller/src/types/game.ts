import type { RollResult } from './roll'

export interface BaseGameRollResult<
  TOutcome = string,
  TRollResult = RollResult
> {
  result: TOutcome
  baseResult: TRollResult
}
