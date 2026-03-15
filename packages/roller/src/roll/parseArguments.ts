import { isDiceNotation, notationToOptions } from '@randsum/notation'
import { optionsToDescription, optionsToNotation, optionsToSidesFaces } from '../lib/transformers'
import { validateRollOptions } from '../lib/optionsValidation'
import { ValidationError } from '../errors'
import type { DiceNotation, ReplaceOptions } from '../types'
import type { RollArgument, RollOptions, RollParams } from '../types'

const FATE_DIE_PATTERN = /^(\d*)[Dd][Ff](?:\.([12]))?$/

const FATE_STANDARD_REPLACE: ReplaceOptions[] = [
  { from: 1, to: -1 },
  { from: 2, to: 0 },
  { from: 3, to: 1 }
]

const FATE_EXTENDED_REPLACE: ReplaceOptions[] = [
  { from: 1, to: -2 },
  { from: 2, to: -1 },
  { from: 3, to: 0 },
  { from: 4, to: 1 },
  { from: 5, to: 2 }
]

function parseFateDieParams(arg: string, position: number): RollParams<never>[] | null {
  const match = FATE_DIE_PATTERN.exec(arg)
  if (!match) return null

  const quantity = match[1] ? Number(match[1]) : 1
  const variant = match[2]
  const isExtended = variant === '2'
  const sides = isExtended ? 5 : 3
  const replace = isExtended ? FATE_EXTENDED_REPLACE : FATE_STANDARD_REPLACE
  const variantSuffix = isExtended ? '.2' : ''
  const notation = `${quantity}dF${variantSuffix}` as DiceNotation
  const description = [`Roll ${quantity}dF${variantSuffix}`]

  return [
    {
      quantity,
      sides,
      arithmetic: 'add',
      modifiers: { replace },
      key: `Roll ${position}`,
      argument: arg as DiceNotation,
      notation,
      description
    }
  ]
}

function isPercentileDie(argument: unknown): argument is 'd%' | 'D%' {
  return argument === 'd%' || argument === 'D%'
}

/**
 * Convert a roll argument to roll options.
 * Handles notation strings, numbers, and options objects.
 */
function optionsFromArgument<T>(argument: RollArgument<T>): RollOptions<T>[] {
  if (isPercentileDie(argument)) {
    return [{ quantity: 1, sides: 100 }]
  }

  if (isDiceNotation(argument)) {
    return [...notationToOptions(argument)]
  }

  if (typeof argument === 'string') {
    throw new ValidationError(`"${argument}" is not valid dice notation`)
  }

  if (typeof argument === 'number') {
    const options = { quantity: 1, sides: argument }
    validateRollOptions(options)
    return [options]
  }

  validateRollOptions(argument)
  return [argument]
}

/**
 * Convert a roll argument to fully resolved roll parameters.
 *
 * @param argument - The roll argument (notation, number, or options)
 * @param position - Position in multi-roll expressions (for key naming)
 * @returns Array of resolved roll parameters
 */
export function parseArguments<T>(argument: RollArgument<T>, position: number): RollParams<T>[] {
  if (typeof argument === 'string') {
    const fateParams = parseFateDieParams(argument, position)
    if (fateParams) return fateParams as RollParams<T>[]
  }

  const allOptions = optionsFromArgument(argument)
  return allOptions.map((options, index) => {
    const indexLabel = index === 0 ? '' : `-${index + 1}`
    const {
      quantity = 1,
      arithmetic = 'add',
      modifiers = {},
      key = `Roll ${position}${indexLabel}`
    } = options
    return {
      ...options,
      ...optionsToSidesFaces(options),
      key,
      modifiers,
      quantity,
      arithmetic,
      argument,
      notation: optionsToNotation(options),
      description: optionsToDescription(options)
    }
  })
}
