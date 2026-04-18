import { coreNotationPattern } from '../notation/coreNotationPattern'
import { isDiceNotation } from '../notation/isDiceNotation'
import { notationToOptions } from '../notation/parse/notationToOptions'
import { optionsToDescription } from '../notation/transformers/optionsToDescription'
import { optionsToNotation } from '../notation/transformers/optionsToNotation'
import { optionsToSidesFaces } from '../notation/transformers/optionsToSidesFaces'
import { validateRollOptions } from '../lib/optionsValidation'
import { validateMaxQuantity, validateMaxSides } from '../lib/utils/validation'
import { ValidationError } from '../errors'
import type { DiceNotation } from '../types'
import type { RollArgument, RollOptions, RollParams } from '../types'

// Multi-pool boundary pattern — detects die types that can start a pool.
// For types that collide with modifiers (D{...}, DD), require leading +/- for mid-string.
// The standard core pattern already handles [+-]?NdN.
const MULTI_POOL_BOUNDARY = new RegExp(
  [
    coreNotationPattern.source,
    String.raw`[+-]\d*[Dd]\{[^}]+\}`,
    String.raw`[+-]\d*[Dd][Dd]\d+`,
    String.raw`[+-]\d*[Dd][Ff](?:\.[12])?`,
    String.raw`[+-]?\d*[Dd]%`,
    String.raw`[+-]\d*[Gg]\d+`,
    String.raw`[+-]\d*[Zz]\d+`
  ].join('|'),
  'g'
)

interface PoolSegment {
  readonly notation: string
  readonly arithmetic: 'add' | 'subtract'
}

// Pattern for detecting the first pool at position 0 (no sign required)
const FIRST_POOL_PATTERN =
  /^\d*[Dd]%|^\d*[Dd][Dd]\d+|^\d*[Dd][Ff](?:\.[12])?|^\d*[Dd]\{[^}]+\}|^\d*[Gg]\d+|^\d*[Zz]\d+/

function splitMultiPoolString(input: string): readonly PoolSegment[] {
  // Quick check: does this string have any signed pool boundaries?
  MULTI_POOL_BOUNDARY.lastIndex = 0
  const signedMatches = Array.from(input.matchAll(MULTI_POOL_BOUNDARY)).filter(m =>
    /^[+-]/.test(m[0])
  )

  if (signedMatches.length === 0) return [{ notation: input, arithmetic: 'add' }]

  // Find where the first signed pool starts — everything before it is the first pool
  const firstSigned = signedMatches[0]
  if (firstSigned === undefined) return [{ notation: input, arithmetic: 'add' }]
  const firstSignedIdx = firstSigned.index
  if (firstSignedIdx === 0) {
    // Entire string starts with a sign — not a valid multi-pool (no first pool)
    return [{ notation: input, arithmetic: 'add' }]
  }

  const firstPoolStr = input.slice(0, firstSignedIdx)
  const restStr = input.slice(firstSignedIdx)

  // Verify the first segment is a valid die (not just modifiers)
  const firstIsSpecial = FIRST_POOL_PATTERN.test(firstPoolStr)
  const firstIsStandard = new RegExp(`^${coreNotationPattern.source}`).test(firstPoolStr)
  if (!firstIsSpecial && !firstIsStandard) {
    return [{ notation: input, arithmetic: 'add' }]
  }

  // Split the rest by signed pool boundaries
  MULTI_POOL_BOUNDARY.lastIndex = 0
  const restMatches = Array.from(restStr.matchAll(MULTI_POOL_BOUNDARY)).filter(m =>
    /^[+-]/.test(m[0])
  )

  const segments: PoolSegment[] = [{ notation: firstPoolStr, arithmetic: 'add' }]

  // Split rest into signed segments
  for (const [i, match] of restMatches.entries()) {
    const start = match.index
    const end = restMatches[i + 1]?.index ?? restStr.length
    const seg = restStr.slice(start, end).trim()

    if (seg.startsWith('-')) {
      segments.push({ notation: seg.slice(1), arithmetic: 'subtract' })
    } else if (seg.startsWith('+')) {
      segments.push({ notation: seg.slice(1), arithmetic: 'add' })
    } else {
      segments.push({ notation: seg, arithmetic: 'add' })
    }
  }

  return segments
}

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
    const parsed = notationToOptions(argument)
    for (const options of parsed) {
      validateMaxQuantity(options.quantity)
      validateMaxSides(options.sides)
    }
    return [...parsed]
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
    // Check for multi-pool string and split into segments, recursing for each
    const segments = splitMultiPoolString(argument)
    if (segments.length > 1) {
      return segments.flatMap((seg, i) => {
        const params = parseArguments<T>(seg.notation as RollArgument<T>, position + i)
        // Apply arithmetic from the segment sign
        if (seg.arithmetic === 'subtract') {
          return params.map(p => ({ ...p, arithmetic: 'subtract' as const }))
        }
        return params
      })
    }

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
