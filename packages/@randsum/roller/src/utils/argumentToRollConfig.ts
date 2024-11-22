import { type RollConfig } from '@randsum/core'
import { isDiceNotation, notationToRollConfig } from '@randsum/notation'

import type { RollArgument } from '../types'
import { isD, isRollConfig } from '../guards'

export function argumentToRollConfig(argument: RollArgument): RollConfig {
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
