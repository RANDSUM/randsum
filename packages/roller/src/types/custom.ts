import type { RollResult } from './roll'

export interface CustomRollResult<T> {
  baseResult: RollResult
  result: T
}
