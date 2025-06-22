import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier,
  optionsConverter
} from '@randsum/core'
import { coreNotationPattern, isDiceNotation } from '@randsum/notation'
import { D } from '../D'
import { isD } from '../guards/isD'
import type { RollArgument, RollParams } from '../types'

/**
 * Normalizes various roll argument types into a consistent RollParams structure
 *
 * This function takes any valid roll argument (numbers, strings, dice notation,
 * die instances, arrays, or options objects) and converts them into a standardized
 * RollParams object that can be used by the dice rolling system.
 *
 * @param argument - Any valid roll argument type
 * @returns Normalized roll parameters with options, die instance, notation, and description
 * @internal
 *
 * @example
 * // Number argument
 * normalizeArgument(20) // Creates d20 roll params
 *
 * @example
 * // Dice notation
 * normalizeArgument('4d6L') // Parses notation into structured params
 *
 * @example
 * // Die instance
 * normalizeArgument(D6) // Uses existing die configuration
 */
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

/**
 * Extracts roll options from various argument types
 *
 * @param argument - The roll argument to convert to options
 * @returns Roll options object
 * @internal
 */
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

/**
 * Creates or extracts a die instance from a roll argument
 *
 * @param argument - The roll argument to create a die from
 * @returns Die instance appropriate for the argument
 * @internal
 */
function dieForArgument(argument: RollArgument): RollParams['die'] {
  if (isD(argument)) {
    return argument
  }
  const options = optionsFromArgument(argument)

  // Handle both numeric and custom dice creation
  if (typeof options.sides === 'number') {
    return D(options.sides)
  } else {
    return D(options.sides)
  }
}
