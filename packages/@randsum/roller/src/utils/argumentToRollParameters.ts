import { D } from '@randsum/dice'
import { isD } from '../guards'
import type { RollArgument, RollParameters } from '../types'
import { argumentToRollConfig } from './argumentToRollConfig'
import { configToDescription, configToNotation } from '@randsum/core'

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
