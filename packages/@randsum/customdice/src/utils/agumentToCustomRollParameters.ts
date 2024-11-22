import type {
  CustomDiceNotation,
  CustomRollArgument,
  CustomRollConfig,
  CustomRollParameters
} from '../types'
import {
  isCustomD,
  isCustomDiceNotation,
  isCustomRollConfigArgument
} from '../guards'
import { CustomD } from '../customD'
import { configToNotation, configToDescription } from '@randsum/core'
import { customNotationToCustomRollConfig } from './customNotationToRollConfig'

function argumentToCustomRollConfig(
  argument: CustomRollArgument
): CustomRollConfig {
  switch (true) {
    case isCustomRollConfigArgument(argument):
      return { quantity: 1, sides: argument.faces.length, ...argument }
    case isCustomD(argument):
      return argument.toRollConfig()
    case isCustomDiceNotation(argument):
      return customNotationToCustomRollConfig(argument)
    default:
      return {
        quantity: 1,
        faces: argument,
        sides: argument.length
      }
  }
}

export function argumentToCustomRollParameters(
  argument: CustomRollArgument
): CustomRollParameters {
  const rollConfig = argumentToCustomRollConfig(argument)
  return {
    argument,
    config: rollConfig,
    die: isCustomD(argument) ? argument : new CustomD(rollConfig.faces),
    notation: configToNotation(rollConfig) as CustomDiceNotation,
    description: configToDescription(rollConfig)
  }
}
