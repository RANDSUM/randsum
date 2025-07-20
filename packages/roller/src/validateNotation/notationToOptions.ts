import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../lib/modifiers'
import { coreNotationPattern } from '../lib/patterns'
import type { DiceNotation, RollOptions } from '../types'
import { formatSides } from './formatSides'

export function notationToOptions(notationString: DiceNotation): RollOptions {
  const trimmedNotationString = notationString.trim()
  const coreNotationMatch =
    trimmedNotationString.match(coreNotationPattern)?.at(0) ?? ''
  const modifiersString = trimmedNotationString.replace(coreNotationMatch, '')
  const [quantityNot, sidesNot = ''] = coreNotationMatch.split(/[Dd]/)

  const quantity = Math.abs(Number(quantityNot))
  const sides = formatSides(sidesNot)
  const arithmetic = Number(quantityNot) < 0 ? 'subtract' : 'add'

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
    arithmetic,
    sides,
    modifiers
  }
}
