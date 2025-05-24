export type AdvantageDisadvantageDH = 'Advantage' | 'Disadvantage'
export interface RollArgumentDH {
  modifier?: number
  rollingWith?: AdvantageDisadvantageDH
}

export type RollResultDHType = 'hope' | 'fear'

export interface RollResultDH {
  type: RollResultDHType
  total: number
  rolls: {
    hope: number
    fear: number
    modifier: number
  }
}

export interface MeetOrBeatResultDH extends RollResultDH {
  success: boolean
  target: number
}
