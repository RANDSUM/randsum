import {
  optionsToDescription,
  optionsToNotation,
  optionsToSidesFaces
} from '../../lib/transformers'
import type { RollArgument, RollParams } from '../../types'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter<T>(argument: RollArgument<T>): RollParams<T>[] {
  const allOptions = optionsFromArgument(argument)
  return allOptions.map((options, index) => {
    const { quantity = 1, arithmetic = 'add', modifiers = {}, key = `Roll ${index}` } = options
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
