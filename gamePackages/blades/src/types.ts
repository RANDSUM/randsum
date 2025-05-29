type BladesCritical = 'critical'
type BladesSuccess = 'success'
type BladesPartial = 'partial'
type BladesFailure = 'failure'

export type BladesResult =
  | BladesCritical
  | BladesSuccess
  | BladesPartial
  | BladesFailure
