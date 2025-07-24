import {
  optionsToDescription,
  optionsToNotation,
  optionsToSidesFaces
} from '../../lib/transformers'
import type { RollArgument, RollParams } from '../../types'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter<T>(argument: RollArgument<T>): RollParams<T>[] {
  const allOptions = optionsFromArgument(argument)
  return allOptions.map(options => {
    const { quantity = 1, arithmetic = 'add', modifiers = {} } = options
    return {
      ...options,
      ...optionsToSidesFaces(options),
      modifiers,
      quantity,
      arithmetic,
      argument,
      notation: optionsToNotation(options),
      description: optionsToDescription(options)
    }
  })
}
