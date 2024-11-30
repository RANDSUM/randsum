import type { RollConfig } from '@randsum/core'
import type { CustomFacesD } from './customFacesD'
import type { RollArgument } from '@randsum/tower'
import type { NotationValidationResult } from '@randsum/notation'

export interface CustomFacesRollConfig extends Omit<RollConfig, 'modifiers'> {
  faces: string[]
}

export interface CustomFacesRollConfigArgument
  extends Omit<Partial<CustomFacesRollConfig>, 'sides'> {
  faces: CustomFacesRollConfig['faces']
}

export type CustomFacesDiceNotation = `${number}${'d' | 'D'}${string}`

export type CustomFacesRollArgument =
  | CustomFacesD
  | CustomFacesRollConfigArgument
  | CustomFacesDiceNotation
  | string[]
  | RollArgument

export interface CustomFacesRollParameters {
  argument: CustomFacesRollArgument
  config: CustomFacesRollConfig
  die: CustomFacesD
}
export interface CustomFacesDicePools {
  [key: string]: CustomFacesRollParameters
}
export interface CustomFacesRollResult {
  dicePools: CustomFacesDicePools
  rawRolls: {
    [key: string]: string[]
  }
  result: string[]
}

type CustomFacesCoreRollOptions = Omit<CustomFacesRollConfig, 'modifiers'>

export type RequiredCustomFacesCoreDiceParameters = {
  [Property in keyof CustomFacesCoreRollOptions]-?: CustomFacesCoreRollOptions[Property]
}

export interface CustomFacesNotationValidationResult
  extends Omit<NotationValidationResult, 'notation'> {
  config: CustomFacesRollConfig
  notation: CustomFacesDiceNotation | undefined
}
