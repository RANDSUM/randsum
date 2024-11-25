import { D } from '@randsum/dice'
import { isD } from '../guards'
import type { RollArgument, RollParameters } from '../types'
import { configToDescription } from '@randsum/core'
import { configToNotation } from '@randsum/notation'
import { argumentToRollConfig } from './argumentToRollConfig'

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
