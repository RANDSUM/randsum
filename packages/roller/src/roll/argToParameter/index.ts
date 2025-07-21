import {
  optionsToDescription,
  optionsToNotation,
  optionsToSidesFaces
} from '../../lib/utils'
import type { RollArgument, RollParams } from '../../types'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter(argument: RollArgument): RollParams[] {
  const allOptions = optionsFromArgument(argument)
  return allOptions.map((options) => {
    const quantity = options.quantity ?? 1
    const arithmetic = options.arithmetic ?? 'add'
    return {
      ...options,
      ...optionsToSidesFaces(options),
      quantity,
      arithmetic,
      argument,
      notation: optionsToNotation(options),
      description: optionsToDescription(options)
    }
  })
}
