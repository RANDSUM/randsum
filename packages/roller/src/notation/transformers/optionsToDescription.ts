import type { RollOptions } from '../types'
import { modifiersToDescription } from './modifiersToStrings'
import { optionsToSidesFaces } from './optionsToSidesFaces'

/**
 * Converts roll options to a human-readable description.
 *
 * @template T - Type for custom dice faces
 * @param options - Roll options to describe
 * @returns Array of description strings
 */
export function optionsToDescription<T = string>(options: RollOptions<T>): string[] {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides, faces = [] } = optionsToSidesFaces(options)
  const descriptor = quantity === 1 ? 'die' : 'dice'
  const coreDescription = `Roll ${quantity} ${sides}-sided ${descriptor}`
  const customCoreDescription = `Roll ${quantity} Dice with the following sides: ${faces.join(', ')}`
  const modifierDescription = modifiersToDescription(modifiers)
  const arithmeticDescription = arithmetic === 'subtract' ? 'and Subtract the result' : ''

  return [
    faces.length ? customCoreDescription : coreDescription,
    ...modifierDescription,
    arithmeticDescription
  ].filter(Boolean)
}
