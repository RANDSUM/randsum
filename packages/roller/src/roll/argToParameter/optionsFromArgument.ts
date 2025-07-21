import { isDiceNotation } from '../../isDiceNotation'
import type { RollArgument, RollOptions } from '../../types'
import { notationToOptions } from '../../lib/utils/notationToOptions'

export function optionsFromArgument(argument: RollArgument): RollOptions[] {
  if (isDiceNotation(argument)) {
    return [...notationToOptions(argument)]
  }

  if (typeof argument === 'string' || typeof argument === 'number') {
    return [{ quantity: 1, sides: Number(argument) }]
  }

  return [
    {
      ...argument,
      sides: argument.faces ? argument.faces.length : argument.sides
    }
  ]
}
