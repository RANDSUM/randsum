import { argumentToRollConfig } from '@randsum/tower'
import { CustomD } from '../customD'
import { isCustomRollConfigArgument } from '../guards'
import type { CustomRollArgument, CustomRollConfig } from '../types'

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
    default: {
      return { ...argumentToRollConfig(arg), faces: [] }
    }
  }
}
