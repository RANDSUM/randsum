import type { RollResult } from '@randsum/roller'

export type RootRpgStrongHit = 'Strong Hit'
export type RootRpgWeakHit = 'Weak Hit'
export type RootRpgMiss = 'Miss'

export type RootRpgResult = RootRpgStrongHit | RootRpgWeakHit | RootRpgMiss

export interface RootRpgRollResult {
  outcome: RootRpgResult
  roll: number
  result: RollResult
}
