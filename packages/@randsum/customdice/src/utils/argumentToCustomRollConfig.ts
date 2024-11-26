import { argumentToRollConfig, type RollArgument } from '@randsum/tower'
import { CustomD } from '../customD'
import { isCustomDiceNotation, isCustomRollConfigArgument } from '../guards'
import type { CustomRollArgument, CustomRollConfig } from '../types'
import { customNotationToCustomRollConfig } from './customNotationToCustomRollConfig'
import { facesFromSides } from './facesFromSides'

function baseArgumentToCustomRollConfig(arg: RollArgument): CustomRollConfig {
  const baseRollConfig = argumentToRollConfig(arg)
  const faces = facesFromSides(baseRollConfig.sides)
  return { ...baseRollConfig, faces }
}

export function argumentToCustomRollConfig(
  arg: CustomRollArgument
): CustomRollConfig {
  switch (true) {
    case Array.isArray(arg):
      return { quantity: 1, faces: arg, sides: arg.length }
    case arg instanceof CustomD: {
      return { quantity: 1, faces: arg.faces, sides: arg.sides }
    }
    case isCustomRollConfigArgument(arg):
      return { quantity: 1, ...arg, sides: arg.faces.length }
    case isCustomDiceNotation(arg):
      return customNotationToCustomRollConfig(arg)
    default: {
      return baseArgumentToCustomRollConfig(arg)
    }
  }
}
