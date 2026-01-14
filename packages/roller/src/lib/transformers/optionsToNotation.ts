import { isDiceNotation } from '../../isDiceNotation'
import type { DiceNotation, RollOptions } from '../../types'
import { processModifierNotations } from '../modifiers'
import { optionsToSidesFaces } from './optionsToSidesFaces'

/**
 * Converts roll options to RANDSUM dice notation string.
 *
 * Generates the canonical notation representation of the roll options.
 *
 * @template T - Type for custom dice faces
 * @param options - Roll options to convert
 * @returns Dice notation string (e.g., "4d6L", "2d20H+5")
 * @throws Error if generated notation is invalid
 *
 * @example
 * ```ts
 * optionsToNotation({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })
 * // Returns: "4d6L"
 *
 * optionsToNotation({ sides: 20, quantity: 2, modifiers: { drop: { lowest: 1 }, plus: 5 } })
 * // Returns: "2d20L+5"
 *
 * optionsToNotation({ sides: 6, quantity: 3, modifiers: { explode: true } })
 * // Returns: "3d6!"
 * ```
 */
export function optionsToNotation<T>(options: RollOptions<T>): DiceNotation {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides } = optionsToSidesFaces(options)
  const arithmeticPrefix = arithmetic === 'subtract' ? '-' : ''
  const modifierSuffix = processModifierNotations(modifiers)
  const proposed = `${arithmeticPrefix}${quantity}d${sides}${modifierSuffix}`

  if (!isDiceNotation(proposed)) {
    throw new Error(`Invalid notation generated: ${proposed}`)
  }
  return proposed
}
