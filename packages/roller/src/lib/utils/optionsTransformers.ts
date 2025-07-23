import { isDiceNotation } from '../../isDiceNotation'
import type { DiceNotation, RollOptions } from '../../types/core'
import { ModifierProcessor } from '../modifiers/processor'

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

export function optionsToSidesFaces<T>(options: RollOptions<T>): {
  sides: number
  faces?: T[]
} {
  if (Array.isArray(options.sides)) {
    return { sides: options.sides.length, faces: options.sides }
  }
  return { sides: options.sides }
}
