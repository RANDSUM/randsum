import { optionsToDescription, optionsToNotation } from '../../lib/utils'
import type { RollArgument, RollParams } from '../../types'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter(argument: RollArgument): RollParams[] {
  const allOptions = optionsFromArgument(argument)
  return allOptions.map((options) => ({
    ...options,
    arithmetic: options.arithmetic ?? 'add',
    argument,
    notation: optionsToNotation(options),
    description: optionsToDescription(options)
  }))
}
