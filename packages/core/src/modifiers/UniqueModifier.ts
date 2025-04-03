import type {
  ModifierOptions,
  NumericRollBonus,
  RequiredNumericRollParameters,
  UniqueOptions
} from '../types'
import { extractMatches } from '../utils/extractMatches'
import { formatters } from '../utils/formatters'
import { InvalidUniqueError } from '../utils/invalidUniqueError'
import { BaseModifier } from './BaseModifier'

/**
 * Modifier that ensures all dice rolls are unique
 *
 * The UniqueModifier prevents duplicate values in dice rolls by rerolling
 * any duplicates. It can also be configured to allow specific values to be
 * duplicated using the notUnique option.
 *
 * @example
 * // Ensure all dice rolls are unique
 * const uniqueMod = new UniqueModifier(true);
 *
 * // Allow 1s to be duplicated, but all other values must be unique
 * const uniqueExceptOnesMod = new UniqueModifier({ notUnique: [1] });
 */
export class UniqueModifier extends BaseModifier<boolean | UniqueOptions> {
  /**
   * Pattern to match unique dice notation
   *
   * Matches 'U' or 'u' optionally followed by a list of numbers in curly braces
   *
   * @example
   * // Matches: 'U', 'u', 'U{1}', 'U{1,2}', etc.
   * // In notation: '4d6U' - Roll 4d6 with unique values
   */
  public static readonly pattern: RegExp = /[Uu]({(\d+,)*(\d+)})?/g
  /**
   * Parses a modifier string to extract unique options
   *
   * @param modifiersString - The string containing modifier notation
   * @returns Object containing parsed unique options
   */
  public static override parse(
    modifiersString: string
  ): Pick<ModifierOptions, 'unique'> {
    return extractMatches(modifiersString, UniqueModifier.pattern).reduce<
      Pick<ModifierOptions, 'unique'>
    >((acc, notationString) => {
      if (notationString.toUpperCase() === 'U') {
        if (typeof acc.unique === 'object') {
          return acc
        }
        return { unique: true }
      }
      const notUnique = notationString
        .replaceAll(/[Uu]{/g, '')
        .replaceAll('}', '')
        .split(',')

      return {
        unique: {
          notUnique: notUnique.map(Number)
        }
      }
    }, {})
  }

  /**
   * Applies the unique modifier to a roll result
   *
   * @param bonus - The current roll bonuses to modify
   * @param param1 - Parameters of the roll being modified
   * @param rollOne - Function to roll a single die
   * @returns Modified roll bonuses with unique values
   * @throws {InvalidUniqueError} If there are more rolls than sides on the die
   */
  public apply(
    bonus: NumericRollBonus,
    { sides, quantity }: RequiredNumericRollParameters,
    rollOne: () => number
  ): NumericRollBonus {
    if (this.options === undefined) return bonus
    if (quantity > sides) {
      throw new InvalidUniqueError()
    }
    const notUnique = this.generateNotUniqueArray()

    const filteredArray = new Set(
      bonus.rolls.filter((n) => !notUnique.includes(Number(n)))
    )

    const uniqueRolls = bonus.rolls.map(Number).map((roll, index, array) => {
      let newRoll: number
      if (array.indexOf(roll) === index || notUnique.includes(roll)) {
        return roll
      }
      do {
        newRoll = rollOne()
      } while (filteredArray.has(newRoll))
      return newRoll
    })

    return {
      ...bonus,
      rolls: uniqueRolls
    }
  }

  /**
   * Generates a human-readable description of the unique modifier
   *
   * @returns Array of description strings or undefined if no unique options
   */
  public toDescription(): string[] | undefined {
    if (this.options === undefined) return undefined
    if (typeof this.options === 'boolean') {
      return ['No Duplicate Rolls']
    }
    return [
      `No Duplicates (except ${this.formatHumanList(this.options.notUnique)})`
    ]
  }

  /**
   * Converts the unique modifier to dice notation format
   *
   * @returns Dice notation string or undefined if no unique options
   */
  public toNotation(): string | undefined {
    if (this.options === undefined) return undefined
    if (typeof this.options === 'boolean') return 'U'
    return `U{${this.options.notUnique.join(',')}}`
  }

  /**
   * Generates an array of values that are allowed to be duplicated
   *
   * @returns Array of values that can be duplicated
   */
  private generateNotUniqueArray(): number[] {
    if (this.options === undefined || typeof this.options === 'boolean') {
      return []
    }
    return this.options.notUnique.map(Number)
  }

  /**
   * Formats a list of numbers into a human-readable string
   *
   * @param list - Array of numbers to format
   * @returns Human-readable string representation of the list
   */
  private formatHumanList(list: number[]): string {
    return formatters.humanList(list)
  }
}
