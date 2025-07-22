export type RootRpgResult = 'Strong Hit' | 'Weak Hit' | 'Miss'

export interface RootRpgRollResult {
  hit: RootRpgResult
  total: number
}
