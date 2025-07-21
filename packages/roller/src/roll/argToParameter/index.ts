import { optionsToDescription, optionsToNotation } from '../../lib/utils'
import type { RollArgument, RollParams } from '../../types'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter(argument: RollArgument): RollParams[] {
  const allOptions = optionsFromArgument(argument)
  return allOptions.map((options) => {
    const sides = options.faces ? options.faces.length : (options.sides ?? 20)
    const quantity = options.quantity ?? 1
    const arithmetic = options.arithmetic ?? 'add'
    const secureOptions = { ...options, sides, quantity, arithmetic }
    return {
      ...options,
      sides,
      quantity,
      arithmetic,
      argument,
      notation: optionsToNotation(secureOptions),
      description: optionsToDescription(secureOptions)
    }
  })
}
