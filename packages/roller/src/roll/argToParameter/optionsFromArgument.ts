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
    const trimmed = argument.trim()
    const coreNotationMatch = trimmed.match(coreNotationPattern) ?? ''
    const coreMatch = coreNotationMatch[0]
    const modifiersString = trimmed.replace(coreMatch, '')
    const [quantity, sides = ''] = coreMatch.split(/[Dd]/)

    const arithmetic = Number(quantity) < 0 ? 'subtract' : 'add'

    return {
      quantity: Math.abs(Number(quantity)),
      sides: Number(sides),
      arithmetic,
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
