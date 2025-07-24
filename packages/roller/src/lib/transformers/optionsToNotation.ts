import { isDiceNotation } from '../../isDiceNotation'
import type { DiceNotation, RollOptions } from '../../types/core'
import { ModifierProcessor } from '../modifiers/processor'
import { optionsToSidesFaces } from './optionsToSidesFaces'

export function optionsToNotation<T>(options: RollOptions<T>): DiceNotation {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides } = optionsToSidesFaces(options)
  const arithmeticPrefix = arithmetic === 'subtract' ? '-' : ''
  const modifierSuffix = ModifierProcessor.processNotations(modifiers)
  const proposed = `${arithmeticPrefix}${quantity}d${sides}${modifierSuffix}`

  if (!isDiceNotation(proposed)) {
    throw new Error(`Invalid notation generated: ${proposed}`)
  }
  return proposed
}
