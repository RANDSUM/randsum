import { isDiceNotation } from '../isDiceNotation'
import { notationToOptions } from '../lib/notation'
import { optionsToDescription, optionsToNotation, optionsToSidesFaces } from '../lib/transformers'
import { validateRollOptions } from '../lib/optionsValidation'
import type { RollArgument, RollOptions, RollParams } from '../types'

/**
 * Convert a roll argument to roll options.
 * Handles notation strings, numbers, and options objects.
 */
function optionsFromArgument<T>(argument: RollArgument<T>): RollOptions<T>[] {
  if (isDiceNotation(argument)) {
    return [...notationToOptions<T>(argument)]
  }

  if (typeof argument === 'string' || typeof argument === 'number') {
    const options = { quantity: 1, sides: Number(argument) }
    validateRollOptions(options)
    return [options]
  }

  validateRollOptions(argument)
  return [argument]
}

/**
 * Convert a roll argument to fully resolved roll parameters.
 *
 * @param argument - The roll argument (notation, number, or options)
 * @param position - Position in multi-roll expressions (for key naming)
 * @returns Array of resolved roll parameters
 */
export function parseArguments<T>(argument: RollArgument<T>, position: number): RollParams<T>[] {
  const allOptions = optionsFromArgument(argument)
  return allOptions.map((options, index) => {
    const indexLabel = index === 0 ? '' : `-${index + 1}`
    const {
      quantity = 1,
      arithmetic = 'add',
      modifiers = {},
      key = `Roll ${position}${indexLabel}`
    } = options
    return {
      ...options,
      ...optionsToSidesFaces(options),
      key,
      modifiers,
      quantity,
      arithmetic,
      argument,
      notation: optionsToNotation(options),
      description: optionsToDescription(options)
    }
  })
}
