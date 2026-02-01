import type { RollOptions } from '../../types'
import { processModifierDescriptionsFromRegistry } from '../modifiers'
import { optionsToSidesFaces } from './optionsToSidesFaces'

/**
 * Converts roll options to a human-readable description.
 *
 * Generates an array of description strings explaining what the roll does,
 * including the base roll and any modifiers.
 *
 * @template T - Type for custom dice faces
 * @param options - Roll options to describe
 * @returns Array of description strings
 *
 * @example
 * ```ts
 * optionsToDescription({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })
 * // Returns: ["Roll 4 6-sided dice", "Drop lowest"]
 *
 * optionsToDescription({ sides: 20, quantity: 1, modifiers: { plus: 5 } })
 * // Returns: ["Roll 1 20-sided die", "Add 5"]
 *
 * // Custom faces
 * optionsToDescription({ sides: ['+', '-', ' '], quantity: 4 })
 * // Returns: ["Roll 4 Dice with the following sides: +, -, "]
 * ```
 */
export function optionsToDescription<T>(options: RollOptions<T>): string[] {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides, faces = [] } = optionsToSidesFaces(options)
  const descriptor = quantity === 1 ? 'die' : 'dice'
  const coreDescription = `Roll ${quantity} ${sides}-sided ${descriptor}`
  const customCoreDescription = `Roll ${quantity} Dice with the following sides: ${faces.join(', ')}`
  const modifierDescription = processModifierDescriptionsFromRegistry(modifiers)
  const arithmeticDescription = arithmetic === 'subtract' ? 'and Subtract the result' : ''

  return [
    faces.length ? customCoreDescription : coreDescription,
    ...modifierDescription,
    arithmeticDescription
  ].filter(Boolean)
}
