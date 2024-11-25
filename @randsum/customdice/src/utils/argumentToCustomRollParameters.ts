import { argumentToCustomRollConfig } from './argumentToCustomRollConfig'
import type { CustomRollArgument, CustomRollParameters } from '../types'
import { CustomD } from '../customD'

export function argumentToCustomRollParameters(
  argument: CustomRollArgument
): CustomRollParameters {
  const rollConfig = argumentToCustomRollConfig(argument)
  return {
    argument,
    config: rollConfig,
    die: argument instanceof CustomD ? argument : new CustomD(rollConfig.faces)
  }
}
