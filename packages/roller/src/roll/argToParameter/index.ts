import { isRollParams } from '../../lib'
import { OptionsConverter } from '../../lib'
import type { RollArgument, RollParams } from '../../types'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter(argument: RollArgument): RollParams {
  const options = optionsFromArgument(argument)
  const converter = new OptionsConverter(options)
  const params = {
    argument,
    options,
    notation: converter.toNotation,
    description: converter.toDescription
  }
  if (isRollParams(params)) {
    return params
  }

  throw new Error('Failed to normalize argument. Please try again.')
}
