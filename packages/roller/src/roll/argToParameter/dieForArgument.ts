import { D } from '../../Dice'
import { isD } from '../../lib'
import type { RollArgument, RollParams } from '../../types'
import { optionsFromArgument } from './optionsFromArgument'

export function dieForArgument(argument: RollArgument): RollParams['die'] {
  if (isD(argument)) {
    return argument
  }
  const options = optionsFromArgument(argument)
  if (Array.isArray(options.sides)) {
    return D(options.sides)
  }
  return D(options.sides)
}
