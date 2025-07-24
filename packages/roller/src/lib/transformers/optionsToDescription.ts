import type { RollOptions } from '../../types'
import { processModifierDescriptions } from '../modifiers'
import { optionsToSidesFaces } from './optionsToSidesFaces'

export function optionsToDescription<T>(options: RollOptions<T>): string[] {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides, faces = [] } = optionsToSidesFaces(options)
  const descriptor = quantity === 1 ? 'die' : 'dice'
  const coreDescription = `Roll ${quantity} ${sides}-sided ${descriptor}`
  const customCoreDescription = `Roll ${quantity} Dice with the following sides: ${faces.join(', ')}`
  const modifierDescription = processModifierDescriptions(modifiers)
  const arithmeticDescription = arithmetic === 'subtract' ? 'and Subtract the result' : ''

  return [
    faces.length ? customCoreDescription : coreDescription,
    ...modifierDescription,
    arithmeticDescription
  ].filter(Boolean)
}
