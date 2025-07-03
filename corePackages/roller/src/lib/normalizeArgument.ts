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
  isDiceNotation,
  optionsConverter
} from '@randsum/core'
import { D } from '../D'
import { isD } from '../guards/isD'
import type { RollArgument, RollParams } from '../types'

export function normalizeArgument(argument: RollArgument): RollParams {
  const options = optionsFromArgument(argument)
  return {
    argument,
    options,
    die: dieForArgument(argument),
    notation: optionsConverter.toNotation(options),
    description: optionsConverter.toDescription(options)
  } as RollParams
}

function optionsFromArgument(argument: RollArgument): RollParams['options'] {
  if (isD(argument)) {
    return argument.toOptions
  }

  if (isDiceNotation(argument)) {
    const coreNotationMatch = argument.match(coreNotationPattern) ?? ''

    const coreMatch = coreNotationMatch[0]
    const modifiersString = argument.replace(coreMatch, '')
    const [quantity, sides = ''] = coreMatch.split(/[Dd]/)

    if (sides.includes('{')) {
      return {
        quantity: Number(quantity),
        sides: [...sides.replaceAll(/{|}/g, '')]
      }
    }

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

  if (Array.isArray(argument)) {
    return { quantity: 1, sides: argument.map(String) }
  }

  if (typeof argument === 'string' || typeof argument === 'number') {
    return { quantity: 1, sides: Number(argument) }
  }
  return argument
}

function dieForArgument(argument: RollArgument): RollParams['die'] {
  if (isD(argument)) {
    return argument
  }
  const options = optionsFromArgument(argument)
  if (Array.isArray(options.sides)) {
    return D(options.sides)
  }
  return D(options.sides)
}
