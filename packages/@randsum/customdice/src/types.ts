import type { RollConfig } from '@randsum/core'
import type { CustomD } from './customD'

export interface CustomRollConfig extends Omit<RollConfig, 'modifiers'> {
  faces: string[]
}

export interface CustomRollConfigArgument
  extends Omit<Partial<CustomRollConfig>, 'sides'> {
  faces: CustomRollConfig['faces']
}

export type CustomDiceNotation = `${number}${'d' | 'D'}{${string}}`

export type CustomRollArgument =
  | CustomD
  | CustomRollConfigArgument
  | CustomDiceNotation
  | string[]
export interface CustomRollParameters {
  argument: CustomRollArgument
  config: CustomRollConfig
  die: CustomD
  notation: CustomDiceNotation
  description: string[]
}
export interface CustomDicePools {
  [key: string]: CustomRollParameters
}
export interface CustomRollResult {
  dicePools: CustomDicePools
  rawRolls: {
    [key: string]: string[]
  }
  result: string[]
}
