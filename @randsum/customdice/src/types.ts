import type { RollConfig } from '@randsum/core'
import type { CustomD } from './customD'
import type { RollArgument } from '@randsum/tower'
import type { NotationValidationResult } from '@randsum/notation'

export interface CustomRollConfig extends Omit<RollConfig, 'modifiers'> {
  faces: string[]
}

export interface CustomRollConfigArgument
  extends Omit<Partial<CustomRollConfig>, 'sides'> {
  faces: CustomRollConfig['faces']
}

export type CustomDiceNotation = `${number}${'d' | 'D'}${string}`

export type CustomRollArgument =
  | CustomD
  | CustomRollConfigArgument
  | CustomDiceNotation
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

type CustomCoreRollOptions = Omit<CustomRollConfig, 'modifiers'>

export type RequiredCustomCoreDiceParameters = {
  [Property in keyof CustomCoreRollOptions]-?: CustomCoreRollOptions[Property]
}

export interface CustomNotationValidationResult
  extends NotationValidationResult {
  config: CustomRollConfig
  notation: CustomDiceNotation
}
