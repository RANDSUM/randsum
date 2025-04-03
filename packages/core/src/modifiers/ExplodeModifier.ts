import { explodePattern } from '../patterns'
import type {
  ModifierOptions,
  NumericRollBonus,
  RequiredNumericRollParameters
} from '../types'
import { extractMatches } from '../utils/extractMatches'
import { BaseModifier } from './BaseModifier'

/**
 * Modifier that adds additional dice when maximum values are rolled
 *
 * The ExplodeModifier adds an additional die roll for each die that shows
 * its maximum value. This is commonly known as "exploding dice" in many
 * tabletop RPG systems.
 *
 * @example
 * // Create an exploding dice modifier
 * const explodeMod = new ExplodeModifier(true);
 */
export class ExplodeModifier extends BaseModifier<boolean> {
  /**
   * Parses a modifier string to extract explode options
   *
   * @param modifiersString - The string containing modifier notation
   * @returns Object containing parsed explode options
   */
  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'explode'> => {
    const notations = extractMatches(modifiersString, explodePattern)
    if (notations.length === 0) {
      return {}
    }
    return { explode: true }
  }

  /**
   * Applies the explode modifier to a roll result
   *
   * @param bonus - The current roll bonuses to modify
   * @param param1 - Parameters of the roll being modified
   * @param rollOne - Function to roll a single die
   * @returns Modified roll bonuses with additional exploded dice
   */
  public apply = (
    bonus: NumericRollBonus,
    { sides }: RequiredNumericRollParameters,
    rollOne: () => number
  ): NumericRollBonus => {
    if (this.options === undefined) return bonus
    const explodeCount = bonus.rolls.filter((roll) => roll === sides).length
    const explodeResults = Array.from({ length: explodeCount }, rollOne)
    const explodedRolls = [...bonus.rolls, ...explodeResults]

    return {
      ...bonus,
      rolls: explodedRolls
    }
  }

  /**
   * Generates a human-readable description of the explode modifier
   *
   * @returns Array of description strings or undefined if no explode options
   */
  public toDescription = (): string[] | undefined => {
    if (this.options === undefined) return undefined
    return ['Exploding Dice']
  }

  /**
   * Converts the explode modifier to dice notation format
   *
   * @returns Dice notation string or undefined if no explode options
   */
  public toNotation = (): string | undefined => {
    if (this.options === undefined) return undefined
    return '!'
  }
}
