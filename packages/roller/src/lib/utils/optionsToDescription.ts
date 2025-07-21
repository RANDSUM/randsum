import type { RollOptions } from '../../types'
import { ModifierProcessor } from './modifierProcessor'

export function optionsToDescription({
  modifiers,
  quantity,
  sides,
  faces = [],
  arithmetic
}: RollOptions): string[] {
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
