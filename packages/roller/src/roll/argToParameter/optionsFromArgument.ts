import { isDiceNotation } from '../../isDiceNotation'
import { notationToOptions } from '../../lib/utils/notationToOptions'
import type { RollArgument, RollOptions } from '../../types/core'

export function optionsFromArgument<T>(
  argument: RollArgument<T>
): RollOptions<T>[] {
  if (isDiceNotation(argument)) {
    return [...notationToOptions<T>(argument)]
  }

  if (typeof argument === 'string' || typeof argument === 'number') {
    return [{ quantity: 1, sides: Number(argument) }]
  }

  return [argument]
}
