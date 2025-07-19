import type { RollResult } from '@randsum/roller'

export type RootRpgStrongHit = 'Strong Hit'
export type RootRpgWeakHit = 'Weak Hit'
export type RootRpgMiss = 'Miss'

export type RootRpgResult = RootRpgStrongHit | RootRpgWeakHit | RootRpgMiss

export type RootRpgRollResult = RollResult<{
  hit: RootRpgResult
  total: number
}>
