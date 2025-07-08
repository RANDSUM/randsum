import { isCustomRollParams, isNumericRollParams } from '../../lib'
import { OptionsConverter } from '../../lib'
import type { RollArgument, RollParams } from '../../types'
import { dieForArgument } from './dieForArgument'
import { optionsFromArgument } from './optionsFromArgument'

export function argToParameter(argument: RollArgument): RollParams {
  const options = optionsFromArgument(argument)
  const converter = new OptionsConverter(options)
  const die = dieForArgument(argument)
  const params = {
    argument,
    options,
    die,
    notation: converter.toNotation,
    description: converter.toDescription
  }
  if (isNumericRollParams(params) || isCustomRollParams(params)) {
    return params
  }

  throw new Error('Failed to normalize argument. Please try again.')
}
