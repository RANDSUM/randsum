import {
  DiceNotation,
  NumberString,
  RandsumOptions,
  RollParameters
} from '../types'
import isDiceNotation from './is-dice-notation'
import isRandsumOptions from './is-randsum-option'
import parseNotation from './parse-notation'
import parseOptions from './parse-options'

const parseArguments = (
  primeArgument: RandsumOptions | DiceNotation | NumberString | undefined
): RollParameters => {
  if (isRandsumOptions(primeArgument)) {
    return parseOptions(primeArgument)
  }

  if (isDiceNotation(primeArgument)) {
    return parseNotation(primeArgument)
  }

  return {
    sides: primeArgument === undefined ? 20 : Number(primeArgument),
    modifiers: [],
    initialRolls: [],
    quantity: 1
  }
}
export default parseArguments
