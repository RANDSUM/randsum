import type { BaseGameRollResult } from '@randsum/roller'

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
  rolls: {
    hope: number
    fear: number
    modifier: number
    advantage: number | undefined
  }
}

export interface DaggerheartGameResult
  extends BaseGameRollResult<number, DaggerheartRollResult> {
  type: DaggerheartRollResultType
}
