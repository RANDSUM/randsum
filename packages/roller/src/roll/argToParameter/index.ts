import {
  optionsToDescription,
  optionsToNotation,
  optionsToSidesFaces
} from '../../lib/transformers'
import type { RollArgument, RollParams } from '../../types'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter<T>(argument: RollArgument<T>, position: number): RollParams<T>[] {
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
