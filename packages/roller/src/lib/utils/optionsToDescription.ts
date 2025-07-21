import type { RollOptions } from '../../types/core'
import { ModifierProcessor } from './modifierProcessor'
import { optionsToSidesFaces } from './optionsToSidesFaces'

export function optionsToDescription<T>(options: RollOptions<T>): string[] {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides, faces = [] } = optionsToSidesFaces(options)
  const descriptor = quantity === 1 ? 'die' : 'dice'
  const coreDescription = `Roll ${String(quantity)} ${String(sides)}-sided ${descriptor}`
  const customCoreDescription = `Roll ${String(quantity)} Dice with the following sides: ${faces.join(', ')}`
  const modifierDescription = ModifierProcessor.processDescriptions(modifiers)
  const arithmeticDescription =
    arithmetic === 'subtract' ? 'and Subtract the result' : ''

  return [
    faces.length > 0 ? customCoreDescription : coreDescription,
    ...modifierDescription,
    arithmeticDescription
  ].filter((r) => !!r)
}
