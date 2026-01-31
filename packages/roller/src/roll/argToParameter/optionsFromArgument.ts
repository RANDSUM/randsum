import { isDiceNotation } from '../../isDiceNotation'
import { notationToOptions } from '../../lib/notation'
import type { RollArgument, RollOptions } from '../../types'
import { validateRollOptions } from '../../lib/optionsValidation'

export function optionsFromArgument<T>(argument: RollArgument<T>): RollOptions<T>[] {
  if (isDiceNotation(argument)) {
    return [...notationToOptions<T>(argument)]
  }

  if (typeof argument === 'string' || typeof argument === 'number') {
    const options = { quantity: 1, sides: Number(argument) }
    validateRollOptions(options)
    return [options]
  }

  // Validate options object API
  validateRollOptions(argument)
  return [argument]
}
