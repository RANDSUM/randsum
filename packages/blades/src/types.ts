import type { NumericRollResult } from '@randsum/roller'

export type BladesCritical = 'critical'
export type BladesSuccess = 'success'
export type BladesPartial = 'partial'
export type BladesFailure = 'failure'

export type BladesResult =
  | BladesCritical
  | BladesSuccess
  | BladesPartial
  | BladesFailure

export interface BladesRollResult {
  outcome: BladesResult
  roll: number
  rolls: number[]
  result: NumericRollResult
}
