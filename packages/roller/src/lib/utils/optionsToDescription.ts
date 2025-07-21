import type { RollOptions } from '../../types'
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

export function optionsToDescription({
  modifiers,
  quantity,
  sides,
  arithmetic
}: RollOptions): string[] {
  const descriptor = quantity === 1 ? 'die' : 'dice'
  const coreDescription = `Roll ${String(quantity)} ${String(sides)}-sided ${descriptor}`
  const modifierDescription = modifiers
    ? [
        new CapModifier(modifiers.cap).toDescription(),
        new DropModifier(modifiers.drop).toDescription(),
        new ReplaceModifier(modifiers.replace).toDescription(),
        new RerollModifier(modifiers.reroll).toDescription(),
        new ExplodeModifier(modifiers.explode).toDescription(),
        new UniqueModifier(modifiers.unique).toDescription(),
        new PlusModifier(modifiers.plus).toDescription(),
        new MinusModifier(modifiers.minus).toDescription()
      ]
        .flat()
        .filter((desc): desc is string => typeof desc === 'string')
        .filter((desc) => desc.length > 0)
    : []
  const arithmeticDescription =
    arithmetic === 'subtract' ? 'and Subtract the result' : ''

  return [
    coreDescription,
    ...modifierDescription,
    arithmeticDescription
  ].filter((r) => !!r)
}
