import { parseNotation } from '../notation/lexer/parse'
import { parsedToOptions } from '../notation/parse/notationToOptions'
import { optionsToDescription } from '../notation/transformers/optionsToDescription'
import { formatNotation, optionsToNotation } from '../notation/transformers/optionsToNotation'
import { optionsToSidesFaces } from '../notation/transformers/optionsToSidesFaces'
import {
  modifiersToDescription,
  modifiersToNotation
} from '../notation/transformers/modifiersToStrings'
import type { ParsedNotationOptions } from '../notation/types'
import { validateRollOptions } from '../lib/optionsValidation'
import { validateModifiers } from '../modifiers/registry'
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
 * die-type semantics come from the lexer (via `parsedToOptions`) — there are no
 * private die-type regexes here. Returns null for standard/percentile pools
 * (handled by the generic path). Modifiers bound to the die are carried through
 * and rendered after the special core, exactly as for a standard pool.
 */
function specialOptionsToParams<T>(
  options: ParsedNotationOptions,
  argument: RollArgument<T>,
  key: string
): RollParams<T> | null {
  const { dieType, quantity, arithmetic, sides } = options
  if (dieType === undefined || dieType === 'standard' || dieType === 'percentile') return null
  const arg = argument as DiceNotation
  const q = quantity
  const qPrefix = q > 1 ? String(q) : ''
  const modifiers = options.modifiers ?? {}
  const suffix = modifiersToNotation(modifiers)
  const modifierDescription = modifiersToDescription(modifiers)

  switch (dieType) {
    case 'fate': {
      const faces = options.fateVariant === 2 ? FATE_EXTENDED_FACES : FATE_STANDARD_FACES
      const variant = options.fateVariant === 2 ? '.2' : ''
      const notation = `${q}dF${variant}${suffix}` as DiceNotation
      return {
        quantity: q,
        sides: faces.length,
        numericFaces: faces,
        arithmetic,
        modifiers,
        key,
        argument: arg,
        notation,
        description: [`Roll ${q}dF${variant}`, ...modifierDescription]
      }
    }
    case 'zeroBias': {
      const faces = Array.from({ length: sides }, (_, i) => i)
      const notation = `${qPrefix}z${sides}${suffix}` as DiceNotation
      return {
        quantity: q,
        sides,
        numericFaces: faces,
        arithmetic,
        modifiers,
        key,
        argument: arg,
        notation,
        description: [`Roll ${q}z${sides}`, ...modifierDescription]
      }
    }
    case 'custom': {
      const rawFaces = options.customFaces ?? []
      const facesStr = rawFaces.join(',')
      const notation = `${qPrefix}d{${facesStr}}${suffix}` as DiceNotation
      const description = [`Roll ${q}d{${facesStr}}`, ...modifierDescription]
      if (isAllNumeric(rawFaces)) {
        return {
          quantity: q,
          sides: rawFaces.length,
          numericFaces: rawFaces.map(Number),
          arithmetic,
          modifiers,
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
        modifiers,
        key,
        argument: arg,
        notation,
        description
      }
    }
    case 'draw': {
      const notation = `${qPrefix}DD${sides}${suffix}` as DiceNotation
      return {
        quantity: q,
        sides,
        draw: true,
        arithmetic,
        modifiers,
        key,
        argument: arg,
        notation,
        description: [`Draw ${q} from d${sides}`, ...modifierDescription]
      }
    }
    case 'geometric': {
      const notation = `${qPrefix}g${sides}${suffix}` as DiceNotation
      return {
        quantity: q,
        sides,
        geometric: true,
        arithmetic,
        modifiers,
        key,
        argument: arg,
        notation,
        description: [
          `Roll g${sides} (geometric: roll d${sides} again on each ${sides}, sum all rolls)`,
          ...modifierDescription
        ]
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
 *
 * Modifiers are validated here, against the resolved pool, so the notation and
 * options entry paths share one check (`1d6L` fails exactly like
 * `{ sides: 6, quantity: 1, modifiers: { drop: { lowest: 1 } } }`).
 */
function optionsToParams<T>(
  options: RollOptions<T> | ParsedNotationOptions,
  argument: RollArgument<T>,
  position: number,
  index: number
): RollParams<T> {
  const suppliedKey = 'key' in options ? options.key : undefined
  const key = suppliedKey ?? keyFor(position, index)

  // A special die resolves its faces (dF, zN, d{...}) before validation; a
  // standard pool must be validated before rendering, which rejects bad values.
  const special = specialOptionsToParams<T>(options as ParsedNotationOptions, argument, key)
  validateModifiers(
    options.modifiers ?? {},
    special
      ? {
          sides: special.sides,
          quantity: special.quantity,
          ...(special.numericFaces ? { faces: special.numericFaces } : {})
        }
      : { sides: optionsToSidesFaces(options).sides, quantity: options.quantity ?? 1 }
  )
  return special ?? genericOptionsToParams<T>(options, argument, key, index)
}

function genericOptionsToParams<T>(
  options: RollOptions<T> | ParsedNotationOptions,
  argument: RollArgument<T>,
  key: string,
  index: number
): RollParams<T> {
  const {
    quantity = 1,
    arithmetic = 'add',
    modifiers = {},
    label,
    // Parse-only discriminants and key are pulled out so they never leak onto RollParams.
    dieType: _dieType,
    fateVariant: _fateVariant,
    customFaces: _customFaces,
    key: _key,
    ...restOptions
  } = options as RollOptions<T> & Partial<ParsedNotationOptions> & { key?: unknown }

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
    // Notation the parser already accepted renders without a second parse.
    notation:
      typeof argument === 'string'
        ? formatNotation(renderOptions)
        : optionsToNotation(renderOptions),
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
 * A notation string is parsed once: `parseNotation` decides validity (throwing on
 * anything it rejects, including oversized input), and `parsedToOptions` turns
 * that same parse into one options object per pool — carrying special-die
 * semantics — which are mapped to RollParams here.
 *
 * @param argument - The roll argument (notation, number, or options)
 * @param position - Position in multi-roll expressions (for key naming)
 * @returns Array of resolved roll parameters
 */
export function parseArguments<T>(argument: RollArgument<T>, position: number): RollParams<T>[] {
  if (typeof argument === 'string') {
    const parsed = parseNotation(argument)
    if (!parsed.valid) {
      throw new ValidationError(`"${argument}" is not valid dice notation`, {
        notation: argument,
        value: argument
      })
    }
    const allOptions = parsedToOptions(argument, parsed)
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
