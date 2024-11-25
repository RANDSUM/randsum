import type { RollConfig } from '@randsum/core'
import type { CustomD } from './customD'
import type { RollArgument } from '@randsum/tower'

export interface CustomRollConfig extends Omit<RollConfig, 'modifiers'> {
  faces: string[]
}

export interface CustomRollConfigArgument
  extends Omit<Partial<CustomRollConfig>, 'sides'> {
  faces: CustomRollConfig['faces']
}

export type CustomRollArgument =
  | CustomD
  | CustomRollConfigArgument
  | string[]
  | RollArgument

export interface CustomRollParameters {
  argument: CustomRollArgument
  config: CustomRollConfig
  die: CustomD
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
