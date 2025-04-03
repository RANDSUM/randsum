import type { ModifierOptions, NumericRollBonus } from '../types'
import { extractMatches } from '../utils/extractMatches'
import { BaseModifier } from './BaseModifier'

/**
 * Modifier that subtracts a fixed value from the roll total
 *
 * The MinusModifier applies a negative modifier to the final roll result,
 * reducing the total by a specified amount.
 *
 * @example
 * // Subtract 3 from the roll total
 * const minusMod = new MinusModifier(3);
 */
export class MinusModifier extends BaseModifier<number> {
  /**
   * Pattern to match minus modifier notation
   *
   * Matches '-' followed by one or more digits
   *
   * @example
   * // Matches: '-1', '-20', etc.
   * // In notation: '1d20-2' - Roll 1d20 and subtract 2
   */
  public static readonly pattern: RegExp = /-\d+/g
  /**
   * Parses a modifier string to extract minus options
   *
   * @param modifiersString - The string containing modifier notation
   * @returns Object containing parsed minus options
   */
  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'minus'> => {
    const notations = extractMatches(modifiersString, MinusModifier.pattern)
    if (notations.length === 0) {
      return {}
    }
    const minus = notations
      .map((notationString) => Number(notationString.split('-')[1]))
      .reduce((acc, num) => acc - num, 0)

    return {
      minus: Math.abs(minus)
    }
  }

  /**
   * Applies the minus modifier to a roll result
   *
   * @param bonus - The current roll bonuses to modify
   * @returns Modified roll bonuses with subtracted value
   */
  public apply = (bonus: NumericRollBonus): NumericRollBonus => {
    if (!this.options) return bonus
    return {
      ...bonus,
      simpleMathModifier: -this.options
    }
  }

  /**
   * Generates a human-readable description of the minus modifier
   *
   * @returns Array of description strings or undefined if no minus options
   */
  public toDescription = (): string[] | undefined => {
    if (!this.options) return undefined
    return [`Subtract ${String(this.options)}`]
  }

  /**
   * Converts the minus modifier to dice notation format
   *
   * @returns Dice notation string or undefined if no minus options
   */
  public toNotation = (): string | undefined => {
    if (!this.options) return undefined
    return `-${String(this.options)}`
  }
}
