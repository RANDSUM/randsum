import { isDiceNotation } from '../notation/isDiceNotation'
import { notationToOptions } from '../notation/parse/notationToOptions'
import { optionsToDescription } from '../notation/transformers/optionsToDescription'
import { optionsToNotation } from '../notation/transformers/optionsToNotation'
import { optionsToSidesFaces } from '../notation/transformers/optionsToSidesFaces'
import { validateRollOptions } from '../lib/optionsValidation'
import { ValidationError } from '../errors'
import type { DiceNotation } from '../types'
import type { RollArgument, RollOptions, RollParams } from '../types'

const DRAW_DIE_PATTERN = /^(\d*)[Dd][Dd](\d+)$/
const GEOMETRIC_DIE_PATTERN = /^(\d*)[Gg](\d+)$/
const FATE_DIE_PATTERN = /^(\d*)[Dd][Ff](?:\.([12]))?$/
const ZERO_BIAS_PATTERN = /^(\d*)[Zz](\d+)$/
const CUSTOM_FACES_PATTERN = /^(\d*)[Dd]\{([^}]+)\}$/

const FATE_STANDARD_FACES = [-1, 0, 1]
const FATE_EXTENDED_FACES = [-2, -1, 0, 1, 2]

function isAllNumeric(values: readonly string[]): boolean {
  return values.every(v => /^-?\d+$/.test(v.trim()))
}

/**
 * Build RollParams for a die with known numeric faces.
 * Used by custom faces (d{...}), Fate dice (dF), and zero-bias (zN).
 * The pipeline selects directly from the face values — no replace modifier needed.
 */
function buildNumericFaceParams<T>(
  faces: readonly number[],
  quantity: number,
  arg: string,
  notation: DiceNotation,
  description: string[],
  position: number
): RollParams<T>[] {
  return [
    {
      quantity,
      sides: faces.length,
      numericFaces: faces,
      arithmetic: 'add',
      modifiers: {},
      key: `Roll ${position}`,
      argument: arg as DiceNotation,
      notation,
      description
    } as RollParams<T>
  ]
}

function parseFateDieParams<T>(arg: string, position: number): RollParams<T>[] | null {
  const match = FATE_DIE_PATTERN.exec(arg)
  if (!match) return null

  const quantity = match[1] ? Number(match[1]) : 1
  const isExtended = match[2] === '2'
  const faces = isExtended ? FATE_EXTENDED_FACES : FATE_STANDARD_FACES
  const variantSuffix = isExtended ? '.2' : ''
  const notation = `${quantity}dF${variantSuffix}` as DiceNotation
  const description = [`Roll ${quantity}dF${variantSuffix}`]

  return buildNumericFaceParams(faces, quantity, arg, notation, description, position)
}

function parseZeroBiasDieParams<T>(arg: string, position: number): RollParams<T>[] | null {
  const match = ZERO_BIAS_PATTERN.exec(arg)
  if (!match) return null

  const quantity = match[1] ? Number(match[1]) : 1
  const sides = Number(match[2])
  const faces = Array.from({ length: sides }, (_, i) => i)
  const notation = `${quantity > 1 ? quantity : ''}z${sides}` as DiceNotation
  const description = [`Roll ${quantity}z${sides}`]

  return buildNumericFaceParams(faces, quantity, arg, notation, description, position)
}

function parseCustomFacesDieParams<T>(arg: string, position: number): RollParams<T>[] | null {
  const match = CUSTOM_FACES_PATTERN.exec(arg)
  if (!match) return null

  const quantity = match[1] ? Number(match[1]) : 1
  const facesStr = match[2]
  if (!facesStr) return null
  const rawFaces = facesStr.split(',').map(f => f.trim())
  const notation = `${quantity > 1 ? quantity : ''}d{${facesStr}}` as DiceNotation
  const description = [`Roll ${quantity}d{${facesStr}}`]

  if (isAllNumeric(rawFaces)) {
    return buildNumericFaceParams(
      rawFaces.map(Number),
      quantity,
      arg,
      notation,
      description,
      position
    )
  }

  // String or mixed faces: use the faces[] path
  // rawFaces are always string[] here; T is the consumer's face type
  const faces: T[] = rawFaces.map(f => f as T)

  return [
    {
      quantity,
      sides: faces.length,
      faces,
      arithmetic: 'add',
      modifiers: {},
      key: `Roll ${position}`,
      argument: arg as DiceNotation,
      notation,
      description
    } as RollParams<T>
  ]
}

function parseDrawDieParams<T>(arg: string, position: number): RollParams<T>[] | null {
  const match = DRAW_DIE_PATTERN.exec(arg)
  if (!match) return null

  const quantity = match[1] ? Number(match[1]) : 1
  const sides = Number(match[2])
  const notation = `${quantity > 1 ? quantity : ''}DD${sides}` as DiceNotation
  const description = [`Draw ${quantity} from d${sides}`]

  return [
    {
      quantity,
      sides,
      draw: true,
      arithmetic: 'add',
      modifiers: {},
      key: `Roll ${position}`,
      argument: arg as DiceNotation,
      notation,
      description
    } as RollParams<T>
  ]
}

function parseGeometricDieParams<T>(arg: string, position: number): RollParams<T>[] | null {
  const match = GEOMETRIC_DIE_PATTERN.exec(arg)
  if (!match) return null

  const quantity = match[1] ? Number(match[1]) : 1
  const sides = Number(match[2])
  const notation = `${quantity > 1 ? quantity : ''}g${sides}` as DiceNotation
  const description = [`Roll g${sides} (geometric: roll d${sides} until 1)`]

  return [
    {
      quantity,
      sides,
      geometric: true,
      arithmetic: 'add',
      modifiers: {},
      key: `Roll ${position}`,
      argument: arg as DiceNotation,
      notation,
      description
    } as RollParams<T>
  ]
}

const PERCENTILE_DIE_PATTERN = /^(\d*)[Dd]%$/

function parsePercentileDie(argument: unknown): { quantity: number; sides: 100 } | null {
  if (typeof argument !== 'string') return null
  const match = PERCENTILE_DIE_PATTERN.exec(argument)
  if (!match) return null
  const quantity = match[1] ? Number(match[1]) : 1
  return { quantity, sides: 100 }
}

/**
 * Convert a roll argument to roll options.
 * Handles notation strings, numbers, and options objects.
 */
function optionsFromArgument<T>(argument: RollArgument<T>): RollOptions<T>[] {
  const percentile = parsePercentileDie(argument)
  if (percentile) {
    return [percentile]
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
    const drawParams = parseDrawDieParams<T>(argument, position)
    if (drawParams) return drawParams

    const geometricParams = parseGeometricDieParams<T>(argument, position)
    if (geometricParams) return geometricParams

    const fateParams = parseFateDieParams(argument, position)
    if (fateParams) return fateParams as RollParams<T>[]

    const zeroBiasParams = parseZeroBiasDieParams(argument, position)
    if (zeroBiasParams) return zeroBiasParams as RollParams<T>[]

    const customFacesParams = parseCustomFacesDieParams(argument, position)
    if (customFacesParams) return customFacesParams as RollParams<T>[]
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
    const label =
      'label' in options
        ? ((options as Record<string, unknown>)['label'] as string | undefined)
        : undefined
    return {
      ...options,
      ...optionsToSidesFaces(options),
      key,
      modifiers,
      quantity,
      arithmetic,
      argument,
      ...(label !== undefined ? { label } : {}),
      notation: optionsToNotation(options),
      description: optionsToDescription(options)
    }
  })
}
