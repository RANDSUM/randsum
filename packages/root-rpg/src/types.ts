import type { BaseGameRollResult } from '@randsum/roller'

export type RootRpgStrongHit = 'Strong Hit'
export type RootRpgWeakHit = 'Weak Hit'
export type RootRpgMiss = 'Miss'

export type RootRpgResult = RootRpgStrongHit | RootRpgWeakHit | RootRpgMiss

export interface RootRpgRollResult extends BaseGameRollResult<RootRpgResult> {
  roll: number
}
