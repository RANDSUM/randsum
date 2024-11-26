import type { DiceNotation, RollConfig } from '@randsum/core'
import type { D } from '@randsum/dice'

export interface RollConfigArgument extends Partial<RollConfig> {
  sides: RollConfig['sides']
}

export type RollArgument =
  | `${number}`
  | number
  | D
  | RollConfigArgument
  | DiceNotation

export interface RollParameters {
  argument: RollArgument
  config: RollConfig
  die: D
  notation: DiceNotation
  description: string[]
}

export interface DicePools {
  [key: string]: RollParameters
}

export interface RollResult {
  dicePools: DicePools
  rawRolls: {
    [key: string]: number[]
  }
  modifiedRolls: {
    [key: string]: {
      rolls: number[]
      total: number
    }
  }
  result: number
  rawResult: number[]
}
