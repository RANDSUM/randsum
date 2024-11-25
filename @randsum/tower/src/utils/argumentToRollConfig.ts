import type { RollConfig } from '@randsum/dice'
import { isDiceNotation, notationToRollConfig } from '@randsum/notation'
import { isRollConfigArgument, isD } from '../guards'
import type { RollArgument } from '../types'

export function argumentToRollConfig(argument: RollArgument): RollConfig {
  switch (true) {
    case isRollConfigArgument(argument):
      return { quantity: 1, ...argument }
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
