import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '@randsum/core'
import { coreNotationPattern } from '../patterns'
import type { DiceNotation, RollOptions } from '../types'

/**
 * Converts dice notation string to structured roll options
 *
 * This function parses a dice notation string and converts it into a
 * structured RollOptions object that can be used by the dice rolling
 * system. It extracts the core dice specification (quantity and sides)
 * and parses all modifiers into their respective configurations.
 *
 * @param notationString - Valid dice notation string to parse
 *
 * @returns Structured roll options object with:
 *   - `quantity`: Number of dice to roll
 *   - `sides`: Number of sides (for numeric dice) or array of faces (for custom dice)
 *   - `modifiers`: Object containing all parsed modifiers (drop, explode, reroll, etc.)
 *
 * @example
 * // Basic numeric dice
 * notationToOptions('4d6')
 * // Returns: { quantity: 4, sides: 6, modifiers: {} }
 *
 * @example
 * // Dice with modifiers
 * notationToOptions('4d6L!+2')
 * // Returns: { quantity: 4, sides: 6, modifiers: { drop: { lowest: 1 }, explode: {}, plus: 2 } }
 *
 * @example
 * // Custom dice faces
 * notationToOptions('2d{H,T}')
 * // Returns: { quantity: 2, sides: ['H', 'T'], modifiers: {} }
 */
export function notationToOptions(notationString: DiceNotation): RollOptions {
  const coreNotationMatch =
    notationString.match(coreNotationPattern)?.at(0) ?? ''
  const modifiersString = notationString.replace(coreNotationMatch, '')
  const [quantityNot, sidesNot = ''] = coreNotationMatch.split(/[Dd]/)

  const quantity = Number(quantityNot)
  const sides = formatSides(sidesNot)

  if (Array.isArray(sides)) {
    return {
      quantity,
      sides,
      modifiers: {}
    }
  }

  return {
    quantity,
    sides,
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

/**
 * Formats the sides portion of dice notation into appropriate type
 *
 * @param sides - The sides portion of the notation (e.g., "6" or "{H,T}")
 * @returns Number for standard dice, array of strings for custom faces
 * @internal
 */
const formatSides = (sides: string): number | string[] => {
  if (sides.includes('{')) {
    return [...sides.replaceAll(/{|}/g, '')]
  }
  return Number(sides)
}
