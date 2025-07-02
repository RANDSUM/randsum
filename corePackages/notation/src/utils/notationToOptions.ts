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
} from '@randsum/core'
import type { DiceNotation, RollOptions } from '../types'

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

  if (Array.isArray(sides)) {
    if (Object.keys(modifiers).length > 0) {
      throw new Error('Custom dice cannot have modifiers')
    }
    return {
      quantity,
      sides,
      modifiers: {}
    }
  }

  return {
    quantity,
    sides,
    modifiers
  }
}

const formatSides = (sides: string): number | string[] => {
  if (sides.includes('{')) {
    return [...sides.replaceAll(/{|}/g, '')]
  }
  return Number(sides)
}
