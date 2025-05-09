import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier,
  optionsConverter,
  type CustomRollOptions,
  type NumericRollOptions
} from '@randsum/core'
import { coreNotationPattern, isDiceNotation, type CustomDiceNotation, type NumericDiceNotation } from '@randsum/notation'
import { D } from '../D'
import { isD } from '../guards/isD'
import type { BaseD, CustomRollArgument, CustomRollParams, NumericRollArgument, NumericRollParams, RollArgument, RollParams } from '../types'

/**
 * Normalizes roll arguments into a consistent format
 *
 * @param argument - The roll argument to normalize
 * @returns Normalized roll parameters with appropriate typing
 */
export function normalizeArgument(argument: NumericRollArgument): NumericRollParams;
export function normalizeArgument(argument: CustomRollArgument): CustomRollParams;
export function normalizeArgument(argument: RollArgument): RollParams;
export function normalizeArgument(argument: RollArgument): RollParams {
  const options = optionsFromArgument(argument)
  const die = dieForArgument(argument)
  const notation = optionsConverter.toNotation(options)
  const description = optionsConverter.toDescription(options)

  // Use type guards to determine the correct return type
  if (typeof options.sides === 'number') {
    return {
      argument: argument as NumericRollArgument,
      options: options as NumericRollOptions,
      die: die as BaseD<number>,
      notation: notation as NumericDiceNotation,
      description
    } as NumericRollParams
  }

  return {
    argument: argument as CustomRollArgument,
    options: options as CustomRollOptions,
    die: die as BaseD<string[]>,
    notation: notation as CustomDiceNotation,
    description
  } as CustomRollParams
}

function optionsFromArgument(argument: RollArgument): RollParams['options'] {
  if (argument instanceof D) {
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
  return new D(options.sides) as RollParams['die']
}
