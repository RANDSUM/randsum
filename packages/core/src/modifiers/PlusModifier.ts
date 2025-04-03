import type { ModifierOptions, NumericRollBonus } from '../types'
import { extractMatches } from '../utils/extractMatches'
import { BaseModifier } from './BaseModifier'

/**
 * Modifier that adds a fixed value to the roll total
 *
 * The PlusModifier applies a positive modifier to the final roll result,
 * increasing the total by a specified amount.
 *
 * @example
 * // Add 3 to the roll total
 * const plusMod = new PlusModifier(3);
 */
export class PlusModifier extends BaseModifier<number> {
  /**
   * Pattern to match plus modifier notation
   *
   * Matches '+' followed by one or more digits
   *
   * @example
   * // Matches: '+1', '+20', etc.
   * // In notation: '1d20+5' - Roll 1d20 and add 5
   */
  public static readonly pattern: RegExp = /\+\d+/g
  /**
   * Parses a modifier string to extract plus options
   *
   * @param modifiersString - The string containing modifier notation
   * @returns Object containing parsed plus options
   */
  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'plus'> => {
    const notations = extractMatches(modifiersString, PlusModifier.pattern)
    if (notations.length === 0) {
      return {}
    }
    const plus = notations
      .map((notationString) => Number(notationString.split('+')[1]))
      .reduce((acc, num) => acc + num, 0)

    return {
      plus
    }
  }

  /**
   * Applies the plus modifier to a roll result
   *
   * @param bonus - The current roll bonuses to modify
   * @returns Modified roll bonuses with added value
   */
  public apply = (bonus: NumericRollBonus): NumericRollBonus => {
    if (!this.options) return bonus
    return {
      ...bonus,
      simpleMathModifier: this.options
    }
  }

  /**
   * Generates a human-readable description of the plus modifier
   *
   * @returns Array of description strings or undefined if no plus options
   */
  public toDescription = (): string[] | undefined => {
    if (!this.options) return undefined
    return [`Add ${String(this.options)}`]
  }

  /**
   * Converts the plus modifier to dice notation format
   *
   * @returns Dice notation string or undefined if no plus options
   */
  public toNotation = (): string | undefined => {
    if (!this.options) return undefined
    return `+${String(this.options)}`
  }
}
