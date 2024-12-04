import { RollArgument } from '~src/tower/types'
import { argumentToRollConfig } from '~src/tower/utils/argumentToRollConfig'
import { CustomFacesD } from '../customFacesD'
import {
  isCustomFacesDiceNotation,
  isCustomFacesRollConfigArgument
} from '../guards'
import { CustomFacesRollArgument, CustomFacesRollConfig } from '../types'
import { customFacesNotationToCustomFacesRollConfig } from './customFacesNotationToCustomFacesRollConfig'
import { facesFromSides } from './facesFromSides'

function baseArgumentToCustomFacesRollConfig(
  arg: RollArgument
): CustomFacesRollConfig {
  const baseRollConfig = argumentToRollConfig(arg)
  const faces = facesFromSides(baseRollConfig.sides)
  return { ...baseRollConfig, faces }
}

export function argumentToCustomFacesRollConfig(
  arg: CustomFacesRollArgument
): CustomFacesRollConfig {
  switch (true) {
    case Array.isArray(arg):
      return { quantity: 1, faces: arg, sides: arg.length }
    case arg instanceof CustomFacesD: {
      return { quantity: 1, faces: arg.faces, sides: arg.sides }
    }
    case isCustomFacesRollConfigArgument(arg):
      return { quantity: 1, ...arg, sides: arg.faces.length }
    case isCustomFacesDiceNotation(arg):
      return customFacesNotationToCustomFacesRollConfig(arg)
    default: {
      return baseArgumentToCustomFacesRollConfig(arg)
    }
  }
}
