import { argumentToCustomFacesRollConfig } from './argumentToCustomFacesRollConfig'
import type {
  CustomFacesRollArgument,
  CustomFacesRollParameters
} from '../types'
import { CustomFacesD } from '../customFacesD'

export function argumentToCustomFacesRollParameters(
  argument: CustomFacesRollArgument
): CustomFacesRollParameters {
  const rollConfig = argumentToCustomFacesRollConfig(argument)
  return {
    argument,
    config: rollConfig,
    die:
      argument instanceof CustomFacesD
        ? argument
        : new CustomFacesD(rollConfig.faces)
  }
}
