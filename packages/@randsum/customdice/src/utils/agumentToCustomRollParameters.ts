import type {
  CustomRollArgument,
  CustomRollConfig,
  CustomRollParameters
} from '../types'
import { isCustomD, isCustomRollConfigArgument } from '../guards'
import { CustomD } from '../customD'
import { configToDescription } from '@randsum/core'

function argumentToCustomRollConfig(
  argument: CustomRollArgument
): CustomRollConfig {
  switch (true) {
    case isCustomRollConfigArgument(argument):
      return { quantity: 1, sides: argument.faces.length, ...argument }
    case isCustomD(argument):
      return argument.toRollConfig()
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
    description: configToDescription(rollConfig)
  }
}
