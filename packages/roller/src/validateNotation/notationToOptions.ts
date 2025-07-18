import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier,
  coreNotationPattern
} from '../lib'
import type { DiceNotation, RollOptions } from '../types'
import { formatSides } from './formatSides'

export function notationToOptions(notationString: DiceNotation): RollOptions {
  const coreNotationMatch =
    notationString.match(coreNotationPattern)?.at(0) ?? ''
  const modifiersString = notationString.replace(coreNotationMatch, '')
  const [quantityNot, sidesNot = ''] = coreNotationMatch.split(/[Dd]/)

  const quantity = Number(quantityNot)
  const sides = formatSides(sidesNot)

  const modifiers = {
    ...DropModifier.parse(modifiersString),
    ...ExplodeModifier.parse(modifiersString),
    ...UniqueModifier.parse(modifiersString),
    ...ReplaceModifier.parse(modifiersString),
    ...RerollModifier.parse(modifiersString),
    ...CapModifier.parse(modifiersString),
    ...PlusModifier.parse(modifiersString),
    ...MinusModifier.parse(modifiersString)
  }

  return {
    quantity,
    sides,
    modifiers
  }
}
