import { D } from '@randsum/dice'
import { isD, isRollConfig } from '../guards'
import type { RollArgument, RollParameters } from '../types'
import {
  configToDescription,
  configToNotation,
  type RollConfig
} from '@randsum/core'
import { isDiceNotation, notationToRollConfig } from '@randsum/notation'

function argumentToRollConfig(argument: RollArgument): RollConfig {
  switch (true) {
    case isRollConfig(argument):
      return argument
    case isD(argument):
      return argument.toRollConfig()
    case isDiceNotation(argument):
      return notationToRollConfig(argument)
    default:
      return {
        quantity: 1,
        sides: Number(argument)
      }
  }
}

export function argumentToRollParameters(
  argument: RollArgument
): RollParameters {
  const rollConfig = argumentToRollConfig(argument)
  return {
    argument,
    config: rollConfig,
    die: isD(argument) ? argument : new D(rollConfig.sides),
    notation: configToNotation(rollConfig),
    description: configToDescription(rollConfig)
  }
}
