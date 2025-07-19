import { OptionsConverter } from '../../lib'
import type { RollArgument, RollParams } from '../../types'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter(argument: RollArgument): RollParams[] {
  const options = optionsFromArgument(argument)
  const converter = new OptionsConverter(options)
  return [
    {
      ...options,
      arithmetic: options.arthmetic ?? 'add',
      argument,
      notation: converter.toNotation,
      description: converter.toDescription
    }
  ]
}
