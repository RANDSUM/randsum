import {
  optionsToDescription,
  optionsToNotation,
  optionsToSidesFaces
} from '../../lib/utils'
import type { RollArgument } from '../../types/core'
import type { RollParams } from '../../types/roll'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter<T>(argument: RollArgument<T>): RollParams<T>[] {
  const allOptions = optionsFromArgument(argument)
  return allOptions.map((options) => {
    const quantity = options.quantity ?? 1
    const arithmetic = options.arithmetic ?? 'add'
    return {
      ...options,
      ...optionsToSidesFaces(options),
      modifiers: options.modifiers ?? {},
      quantity,
      arithmetic,
      argument,
      notation: optionsToNotation(options),
      description: optionsToDescription(options)
    }
  })
}
