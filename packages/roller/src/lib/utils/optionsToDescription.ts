import type { RollOptions } from '../../types'
import { ModifierProcessor } from './modifierProcessor'

export function optionsToDescription({
  modifiers,
  quantity,
  sides,
  arithmetic
}: RollOptions): string[] {
  const descriptor = quantity === 1 ? 'die' : 'dice'
  const coreDescription = `Roll ${String(quantity)} ${String(sides)}-sided ${descriptor}`
  const modifierDescription = ModifierProcessor.processDescriptions(modifiers)
  const arithmeticDescription =
    arithmetic === 'subtract' ? 'and Subtract the result' : ''

  return [
    coreDescription,
    ...modifierDescription,
    arithmeticDescription
  ].filter((r) => !!r)
}
