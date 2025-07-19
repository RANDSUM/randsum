import { isDiceNotation } from '../../lib'
import type { RollArgument, RollOptions } from '../../types'
import { notationToOptions } from '../../validateNotation/notationToOptions'

export function optionsFromArgument(argument: RollArgument): RollOptions {
  if (isDiceNotation(argument)) {
    return notationToOptions(argument)
  }

  if (typeof argument === 'string' || typeof argument === 'number') {
    return { quantity: 1, sides: Number(argument) }
  }
  return argument
}
