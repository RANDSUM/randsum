export type AdvantageDisadvantageDH = 'Advantage' | 'Disadvantage'
export interface RollArgumentDH {
  modifier: number
  rollingWith?: AdvantageDisadvantageDH
}

export type RollResultDHType = 'hope' | 'fear'

export interface CoreRollResultDH {
  type: RollResultDHType
  total: number
  rolls: {
    hope: number
    fear: number
    modifier: number
  }
}

export interface RollResultDH extends CoreRollResultDH {
  success: boolean
  target: number
}
