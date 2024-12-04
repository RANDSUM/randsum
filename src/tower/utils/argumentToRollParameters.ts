import { configToDescription } from '~src/core/utils/configToDescription'
import { D } from '~src/dice/D'
import { isD } from '../guards'
import type { RollArgument, RollParameters } from '../types'
import { argumentToRollConfig } from './argumentToRollConfig'
import { configToNotation } from '~src/notation/utils/configToNotation'

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
