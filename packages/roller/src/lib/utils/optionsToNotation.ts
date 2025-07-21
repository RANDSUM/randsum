import { isDiceNotation } from '../../isDiceNotation'
import type { DiceNotation, RollOptions } from '../../types'
import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../modifiers'

export function optionsToNotation({
  modifiers,
  quantity = 1,
  sides,
  arithmetic
}: RollOptions): DiceNotation {
  const coreNotation = `${quantity}d${sides}`
  const arithmeticNotation = arithmetic === 'subtract' ? '-' : ''
  const modifierNotation = modifiers
    ? [
        new CapModifier(modifiers.cap).toNotation(),
        new DropModifier(modifiers.drop).toNotation(),
        new ReplaceModifier(modifiers.replace).toNotation(),
        new RerollModifier(modifiers.reroll).toNotation(),
        new ExplodeModifier(modifiers.explode).toNotation(),
        new UniqueModifier(modifiers.unique).toNotation(),
        new PlusModifier(modifiers.plus).toNotation(),
        new MinusModifier(modifiers.minus).toNotation()
      ]
        .filter((notation): notation is string => typeof notation === 'string')
        .join('')
    : []

  const proposed = `${arithmeticNotation}${coreNotation}${modifierNotation}`

  if (!isDiceNotation(proposed)) {
    throw new Error(`Invalid notation generated: ${proposed}`)
  }
  return proposed
}
