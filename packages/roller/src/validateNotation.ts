import type { DiceNotation, RollOptions, ValidationResult } from './types'
import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  ModifierConflictError,
  OptionsConverter,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier,
  coreNotationPattern,
  isDiceNotation
} from './lib'

export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      description: ['Invalid Notation'],
      digested: {},
      type: 'invalid'
    }
  }

  try {
    const digested = notationToOptions(notation)
    const converter = new OptionsConverter(digested)
    return {
      valid: true,
      digested,
      notation: converter.toNotation,
      type: calculateDieType(digested.sides),
      description: converter.toDescription
    } as ValidationResult
  } catch {
    const error = ModifierConflictError.forCustomDiceWithModifiers(notation)
    return {
      valid: false,
      description: [error.message, ...error.suggestions],
      digested: {},
      type: 'invalid'
    }
  }
}

function calculateDieType(sides: number | string[]): 'custom' | 'numeric' {
  if (Array.isArray(sides)) {
    return 'custom'
  }
  return 'numeric'
}

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
