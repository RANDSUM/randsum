import { isDiceNotation } from '../../isDiceNotation'
import type { DiceNotation, RollOptions } from '../../types/core'
import { ModifierProcessor } from './modifierProcessor'
import { optionsToSidesFaces } from './optionsToSidesFaces'

export function optionsToNotation<T>(options: RollOptions<T>): DiceNotation {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides } = optionsToSidesFaces(options)
  const coreNotation = `${quantity}d${sides}`
  const arithmeticNotation = arithmetic === 'subtract' ? '-' : ''
  const modifierNotation = ModifierProcessor.processNotations(modifiers)

  const proposed = `${arithmeticNotation}${coreNotation}${modifierNotation}`

  if (!isDiceNotation(proposed)) {
    throw new Error(`Invalid notation generated: ${proposed}`)
  }
  return proposed
}
