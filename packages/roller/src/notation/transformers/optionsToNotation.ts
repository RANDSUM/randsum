import type { DiceNotation, RollOptions } from '../types'
import { NotationParseError } from '../../errors'
import { isDiceNotation } from '../isDiceNotation'
import { modifiersToNotation } from './modifiersToStrings'
import { optionsToSidesFaces } from './optionsToSidesFaces'

/**
 * Converts roll options to RANDSUM dice notation string.
 *
 * @template T - Type for custom dice faces
 * @param options - Roll options to convert
 * @returns Dice notation string (e.g., "4d6L", "2d20H+5")
 * @throws NotationParseError if generated notation is invalid
 */
export function optionsToNotation<T = string>(options: RollOptions<T>): DiceNotation {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides } = optionsToSidesFaces(options)
  const arithmeticPrefix = arithmetic === 'subtract' ? '-' : ''
  const modifierSuffix = modifiersToNotation(modifiers)
  const proposed = `${arithmeticPrefix}${quantity}d${sides}${modifierSuffix}`

  if (!isDiceNotation(proposed)) {
    throw new NotationParseError(proposed, 'Generated notation is invalid', undefined, {
      value: options
    })
  }
  return proposed
}
