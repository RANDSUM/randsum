import { isDiceNotation } from '../../isDiceNotation'
import type { DiceNotation, RollOptions } from '../../types'
import { ModifierProcessor } from './modifierProcessor'

export function optionsToNotation({
  modifiers,
  quantity = 1,
  sides,
  arithmetic
}: RollOptions): DiceNotation {
  const coreNotation = `${quantity}d${sides}`
  const arithmeticNotation = arithmetic === 'subtract' ? '-' : ''
  const modifierNotation = ModifierProcessor.processNotations(modifiers)

  const proposed = `${arithmeticNotation}${coreNotation}${modifierNotation}`

  if (!isDiceNotation(proposed)) {
    throw new Error(`Invalid notation generated: ${proposed}`)
  }
  return proposed
}
