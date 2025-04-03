import type {
  ComparisonOptions,
  ModifierOptions,
  NumericRollBonus
} from '../types'
import { extractMatches } from '../utils/extractMatches'
import { formatters } from '../utils/formatters'
import { BaseModifier } from './BaseModifier'

/**
 * Modifier that caps dice roll values at specified thresholds
 *
 * The CapModifier ensures dice rolls don't exceed or fall below certain values,
 * replacing any rolls outside the specified range with the threshold value.
 *
 * @example
 * // Cap rolls greater than 4 and less than 2
 * const capMod = new CapModifier({ greaterThan: 4, lessThan: 2 });
 */
export class CapModifier extends BaseModifier<ComparisonOptions> {
  /**
   * Pattern to match cap notation
   *
   * Matches 'C' or 'c' followed by a list of constraints in curly braces
   *
   * @example
   * // Matches: 'C{>18}', 'c{<2}', etc.
   * // In notation: '3d20C{>18}' - Roll 3d20 and cap any values greater than 18 at 18
   */
  public static readonly pattern: RegExp = new RegExp(
    `${/[Cc]/.source}${/{([<>]\d+,)*([<>]\d+)}/.source}`,
    'g'
  )
  /**
   * Parses a modifier string to extract cap options
   *
   * @param modifiersString - The string containing modifier notation
   * @returns Object containing parsed cap options
   */
  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'cap'> => {
    const notations = extractMatches(modifiersString, CapModifier.pattern)
    if (notations.length === 0) {
      return {}
    }
    return notations.reduce<Pick<ModifierOptions, 'cap'>>(
      (acc, notationString = '') => {
        const capString = (notationString.split(/[Cc]/)[1] ?? '')
          .replaceAll(/{|}/g, '')
          .split(',')

        const capOptions = capString.reduce<ComparisonOptions>(
          (innerAcc, note) => {
            if (note.includes('<')) {
              return {
                ...innerAcc,
                lessThan: Number(note.replaceAll('<', ''))
              }
            }
            return {
              ...innerAcc,
              greaterThan: Number(note.replaceAll('>', ''))
            }
          },
          {}
        )

        return {
          cap: {
            ...acc.cap,
            ...capOptions
          }
        }
      },
      { cap: {} }
    )
  }

  /**
   * Creates a function that applies capping to a single die roll
   *
   * @param param0 - Comparison options with greaterThan and lessThan thresholds
   * @param value - Optional value to use instead of the threshold
   * @returns Function that caps a roll value based on the provided thresholds
   */
  public static applySingleCap = (
    { greaterThan, lessThan }: ComparisonOptions,
    value?: number
  ): ((roll: number) => number) => {
    return (roll: number) => {
      if (greaterThan !== undefined && roll > greaterThan) {
        return value ?? greaterThan
      }
      if (lessThan !== undefined && roll < lessThan) {
        return value ?? lessThan
      }
      return roll
    }
  }

  /**
   * Applies the cap modifier to a roll result
   *
   * @param bonus - The current roll bonuses to modify
   * @returns Modified roll bonuses with capped values
   */
  public apply = (bonus: NumericRollBonus): NumericRollBonus => {
    if (this.options === undefined) return bonus
    return {
      ...bonus,
      rolls: bonus.rolls.map(CapModifier.applySingleCap(this.options))
    }
  }

  /**
   * Generates a human-readable description of the cap modifier
   *
   * @returns Array of description strings or undefined if no cap options
   */
  public toDescription = (): string[] | undefined => {
    if (this.options === undefined) return undefined
    return formatters.greaterLess
      .descriptions(this.options)
      .map((str) => `No Rolls ${String(str)}`)
  }

  /**
   * Converts the cap modifier to dice notation format
   *
   * @returns Dice notation string or undefined if no cap options
   */
  public toNotation = (): string | undefined => {
    if (this.options === undefined) return undefined
    const capList = formatters.greaterLess.notation(this.options)
    return `C{${capList.join(',')}}`
  }
}
