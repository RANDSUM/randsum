import { parseNotation } from '../notation/lexer/parse'
import { notationToOptions } from '../notation/parse/notationToOptions'
import { optionsToDescription } from '../notation/transformers/optionsToDescription'
import { optionsToNotation } from '../notation/transformers/optionsToNotation'
import { optionsToSidesFaces } from '../notation/transformers/optionsToSidesFaces'
import type { ParsedNotationOptions } from '../notation/types'
import { validateRollOptions } from '../lib/optionsValidation'
import { validateMaxQuantity, validateMaxSides } from '../lib/utils/validation'
import { ValidationError } from '../errors'
import type { DiceNotation } from '../types'
import type { RollArgument, RollOptions, RollParams } from '../types'

const FATE_STANDARD_FACES = [-1, 0, 1]
const FATE_EXTENDED_FACES = [-2, -1, 0, 1, 2]

function isAllNumeric(values: readonly string[]): boolean {
  return values.every(v => /^-?\d+$/.test(v.trim()))
}

function keyFor(position: number, index: number): string {
  return `Roll ${position}${index === 0 ? '' : `-${index + 1}`}`
}

/**
 * Build RollParams for a special die directly from its parsed options. The
 * die-type semantics come from the lexer (via `notationToOptions`) — there are no
 * private die-type regexes here anymore. Returns null for standard/percentile
 * pools (handled by the generic path). Special dice carrying modifiers are never
 * emitted as special options (they degrade to a `0d0` pool upstream), so this
 * only ever sees modifier-free special dice — matching roller's rule that special
 * dice reject modifiers.
 */
function specialOptionsToParams<T>(
  options: ParsedNotationOptions,
  argument: RollArgument<T>,
  key: string
): RollParams<T> | null {
  const { dieType, quantity, arithmetic, sides } = options
  const arg = argument as DiceNotation
  const q = quantity
  const qPrefix = q > 1 ? String(q) : ''

  switch (dieType) {
    case 'fate': {
      const faces = options.fateVariant === 2 ? FATE_EXTENDED_FACES : FATE_STANDARD_FACES
      const suffix = options.fateVariant === 2 ? '.2' : ''
      const notation = `${q}dF${suffix}` as DiceNotation
      return {
        quantity: q,
        sides: faces.length,
        numericFaces: faces,
        arithmetic,
        modifiers: {},
        key,
        argument: arg,
        notation,
        description: [`Roll ${q}dF${suffix}`]
      }
    }
    case 'zeroBias': {
      const faces = Array.from({ length: sides }, (_, i) => i)
      const notation = `${qPrefix}z${sides}` as DiceNotation
      return {
        quantity: q,
        sides,
        numericFaces: faces,
        arithmetic,
        modifiers: {},
        key,
        argument: arg,
        notation,
        description: [`Roll ${q}z${sides}`]
      }
    }
    case 'custom': {
      const rawFaces = options.customFaces ?? []
      const facesStr = rawFaces.join(',')
      const notation = `${qPrefix}d{${facesStr}}` as DiceNotation
      const description = [`Roll ${q}d{${facesStr}}`]
      if (isAllNumeric(rawFaces)) {
        return {
          quantity: q,
          sides: rawFaces.length,
          numericFaces: rawFaces.map(Number),
          arithmetic,
          modifiers: {},
          key,
          argument: arg,
          notation,
          description
        }
      }
      return {
        quantity: q,
        sides: rawFaces.length,
        faces: rawFaces.map(f => f as T),
        arithmetic,
        modifiers: {},
        key,
        argument: arg,
        notation,
        description
      }
    }
    case 'draw': {
      const notation = `${qPrefix}DD${sides}` as DiceNotation
      return {
        quantity: q,
        sides,
        draw: true,
        arithmetic,
        modifiers: {},
        key,
        argument: arg,
        notation,
        description: [`Draw ${q} from d${sides}`]
      }
    }
    case 'geometric': {
      const notation = `${qPrefix}g${sides}` as DiceNotation
      return {
        quantity: q,
        sides,
        geometric: true,
        arithmetic,
        modifiers: {},
        key,
        argument: arg,
        notation,
        description: [`Roll g${sides} (geometric: roll d${sides} until 1)`]
      }
    }
    default:
      return null
  }
}

/**
 * Map a single options object (from notation parsing or a caller-supplied options
 * argument) to fully-resolved RollParams. Standard and percentile pools use the
 * generic transformers; special dice are built by `specialOptionsToParams`.
 */
function optionsToParams<T>(
  options: RollOptions<T> | ParsedNotationOptions,
  argument: RollArgument<T>,
  position: number,
  index: number
): RollParams<T> {
  const suppliedKey = 'key' in options ? options.key : undefined
  const key = suppliedKey ?? keyFor(position, index)

  const special = specialOptionsToParams<T>(options as ParsedNotationOptions, argument, key)
  if (special) return special

  const {
    quantity = 1,
    arithmetic = 'add',
    modifiers = {},
    label,
    ...restOptions
  } = options as RollOptions<T> & Partial<ParsedNotationOptions>
  // Strip parse-only discriminants and key so they never leak onto RollParams.
  delete (restOptions as { dieType?: unknown }).dieType
  delete (restOptions as { fateVariant?: unknown }).fateVariant
  delete (restOptions as { customFaces?: unknown }).customFaces
  delete (restOptions as { key?: unknown }).key

  // A leading-signed FIRST pool (e.g. `-4d6`) renders its sign in the notation and
  // description; an additional subtractive pool inside a multi-pool string (e.g.
  // the `1d8` of `1d20-1d8`) carries `arithmetic: 'subtract'` but renders without
  // the sign. Normalize the render-only options for the latter.
  const renderOptions =
    index > 0 && arithmetic === 'subtract'
      ? ({ ...options, arithmetic: 'add' } as typeof options)
      : options

  return {
    ...restOptions,
    ...optionsToSidesFaces(options),
    key,
    modifiers,
    quantity,
    arithmetic,
    argument,
    ...(label !== undefined ? { label } : {}),
    notation: optionsToNotation(renderOptions),
    description: optionsToDescription(renderOptions)
  }
}

/**
 * Convert a non-string roll argument (number or options object) to options.
 */
function nonStringOptions<T>(argument: Exclude<RollArgument<T>, string>): RollOptions<T>[] {
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
 * Notation strings flow through the single cursor parser: `parseNotation` decides
 * validity (throwing on anything it rejects, including oversized input), then
 * `notationToOptions` yields one options object per pool — carrying special-die
 * semantics — which are mapped to RollParams here. There is no separate multi-pool
 * splitter or per-die-type regex table anymore.
 *
 * @param argument - The roll argument (notation, number, or options)
 * @param position - Position in multi-roll expressions (for key naming)
 * @returns Array of resolved roll parameters
 */
export function parseArguments<T>(argument: RollArgument<T>, position: number): RollParams<T>[] {
  if (typeof argument === 'string') {
    if (!parseNotation(argument).valid) {
      throw new ValidationError(`"${argument}" is not valid dice notation`, {
        notation: argument,
        value: argument
      })
    }
    const allOptions = notationToOptions(argument)
    for (const options of allOptions) {
      validateMaxQuantity(options.quantity)
      validateMaxSides(options.sides)
    }
    return allOptions.map((options, index) =>
      optionsToParams<T>(options, argument, position, index)
    )
  }

  return nonStringOptions<T>(argument).map((options, index) =>
    optionsToParams<T>(options, argument, position, index)
  )
}
