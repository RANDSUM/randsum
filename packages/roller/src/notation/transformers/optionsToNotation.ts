import type { DiceNotation, ParsedDieType, RollOptions } from '../types'
import { NotationParseError } from '../../errors'
import { isDiceNotation } from '../isDiceNotation'
import { modifiersToNotation } from './modifiersToStrings'
import { optionsToSidesFaces } from './optionsToSidesFaces'

/** What the parser records about a special die, beside the plain roll options. */
interface ParsedDie {
  dieType?: ParsedDieType | undefined
  fateVariant?: 1 | 2 | undefined
  customFaces?: readonly string[] | undefined
}

/**
 * The die of a pool as notation. Options parsed from a string carry the die they
 * were written with, so `z6` renders as `1z6` and not as the `1d6` its sides suggest.
 * Percentile stays `d100`, which is the same die.
 */
function formatDie(
  quantity: number,
  sides: number,
  { dieType, fateVariant, customFaces }: ParsedDie
): string {
  switch (dieType) {
    case 'zeroBias':
      return `${quantity}z${sides}`
    case 'geometric':
      return `${quantity}g${sides}`
    case 'draw':
      return `${quantity}DD${sides}`
    case 'fate':
      return `${quantity}dF${fateVariant === 2 ? '.2' : ''}`
    case 'custom':
      return customFaces === undefined
        ? `${quantity}d${sides}`
        : `${quantity}d{${customFaces.join(',')}}`
    default:
      return `${quantity}d${sides}`
  }
}

/**
 * Render options as notation without re-validating it. Internal: only for
 * options the parser produced from notation it already accepted.
 */
export function formatNotation<T = string>(options: RollOptions<T> & ParsedDie): DiceNotation {
  const { modifiers, quantity = 1, arithmetic, label } = options
  const { sides } = optionsToSidesFaces(options)
  const arithmeticPrefix = arithmetic === 'subtract' ? '-' : ''
  const annotation = label === undefined ? '' : `[${label}]`
  return `${arithmeticPrefix}${formatDie(quantity, sides, options)}${modifiersToNotation(modifiers)}${annotation}` as DiceNotation
}

/**
 * Converts roll options to RANDSUM dice notation string.
 *
 * @template T - Type for custom dice faces
 * @param options - Roll options to convert
 * @returns Dice notation string (e.g., "4d6L", "2d20H+5")
 * @throws NotationParseError if generated notation is invalid
 */
export function optionsToNotation<T = string>(options: RollOptions<T>): DiceNotation {
  const proposed = formatNotation(options)
  if (!isDiceNotation(proposed)) {
    throw new NotationParseError(proposed, 'Generated notation is invalid', undefined, {
      value: options
    })
  }
  return proposed
}
