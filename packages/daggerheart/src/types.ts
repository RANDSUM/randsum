import type { RollResult } from '@randsum/roller'

export type DaggerheartAdvantageDisadvantage = 'Advantage' | 'Disadvantage'
export interface DaggerheartRollArgument {
  modifier?: number
  rollingWith?: DaggerheartAdvantageDisadvantage
  amplifyHope?: boolean
  amplifyFear?: boolean
}

export type DaggerheartRollResultType = 'hope' | 'fear' | 'critical hope'

export interface DaggerheartRollResult {
  total: number
  type: DaggerheartRollResultType
  details: {
    hope: number
    fear: number
    modifier: number
    advantage: number | undefined
    amplifyHope: boolean
    amplifyFear: boolean
  }
}

export type DaggerheartGameResult = RollResult<DaggerheartRollResult>
