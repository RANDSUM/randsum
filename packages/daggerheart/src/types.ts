export type DHAdvantageDisadvantage = 'Advantage' | 'Disadvantage'
export interface DHRollArgument {
  modifier?: number
  rollingWith?: DHAdvantageDisadvantage
  amplifyHope?: boolean
  amplifyFear?: boolean
}

export type DHRollResultType = 'hope' | 'fear' | 'critical hope'

export interface DHRollResult {
  type: DHRollResultType
  total: number
  rolls: {
    hope: number
    fear: number
    modifier: number
    advantage: number | undefined
  }
}

export interface DHMeetOrBeatResult extends DHRollResult {
  success: boolean
  target: number
  description: string
}
