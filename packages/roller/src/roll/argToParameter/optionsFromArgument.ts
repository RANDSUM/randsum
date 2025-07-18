import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier,
  coreNotationPattern,
  isDiceNotation
} from '../../lib'
import type { RollArgument, RollOptions } from '../../types'

export function optionsFromArgument(argument: RollArgument): RollOptions {
  if (isDiceNotation(argument)) {
    const coreNotationMatch = argument.match(coreNotationPattern) ?? ''
    const coreMatch = coreNotationMatch[0]
    const modifiersString = argument.replace(coreMatch, '')
    const [quantity, sides = ''] = coreMatch.split(/[Dd]/)

    return {
      quantity: Number(quantity),
      sides: Number(sides),
      ...{
        modifiers: {
          ...DropModifier.parse(modifiersString),
          ...ExplodeModifier.parse(modifiersString),
          ...UniqueModifier.parse(modifiersString),
          ...ReplaceModifier.parse(modifiersString),
          ...RerollModifier.parse(modifiersString),
          ...CapModifier.parse(modifiersString),
          ...PlusModifier.parse(modifiersString),
          ...MinusModifier.parse(modifiersString)
        }
      }
    }
  }

  if (typeof argument === 'string' || typeof argument === 'number') {
    return { quantity: 1, sides: Number(argument) }
  }
  return argument
}
