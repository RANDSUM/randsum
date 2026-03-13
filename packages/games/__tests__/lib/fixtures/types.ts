export interface GameRollResult<TResult, TDetails = undefined, TRollRecord = never> {
  rolls: TRollRecord[]
  total: number
  result: TResult
  details?: TDetails
}
