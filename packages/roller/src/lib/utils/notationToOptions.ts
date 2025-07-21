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
import { coreNotationPattern } from '../patterns'
import type { DiceNotation, RollOptions } from '../../types'

export function notationToOptions(notationString: DiceNotation): RollOptions {
  const trimmedNotationString = notationString.trim()
  const coreNotationMatch =
    trimmedNotationString.match(coreNotationPattern)?.at(0) ?? ''
  const modifiersString = trimmedNotationString.replace(coreNotationMatch, '')
  const [quantityNot, sidesNotation = ''] = coreNotationMatch.split(/[Dd]/)

  return {
    quantity: Math.abs(Number(quantityNot)),
    arithmetic: Number(quantityNot) < 0 ? 'subtract' : 'add',
    sides: Number(sidesNotation),
    modifiers: {
      ...DropModifier.parse(modifiersString),
      ...ExplodeModifier.parse(modifiersString),
      ...UniqueModifier.parse(modifiersString),
      ...ReplaceModifier.parse(modifiersString),
      ...RerollModifier.parse(modifiersString),
      ...CapModifier.parse(modifiersString),
      ...PlusModifier.parse(modifiersString),
      ...MinusModifier.parse(modifiersString)
    }
  }
}
