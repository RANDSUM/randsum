import type { DropOptions, ModifierOptions, NumericRollBonus } from '../types'
import { extractMatches } from '../utils/extractMatches'
import { formatters } from '../utils/formatters'
import { BaseModifier } from './BaseModifier'

/**
 * Modifier that removes specific dice from the roll results
 *
 * The DropModifier can remove dice based on various criteria:
 * - Highest N dice
 * - Lowest N dice
 * - Dice with specific values
 * - Dice greater than or less than specific values
 *
 * @example
 * // Drop the highest die and any dice with value 1
 * const dropMod = new DropModifier({ highest: 1, exact: [1] });
 */
export class DropModifier extends BaseModifier<DropOptions> {
  /**
   * Pattern to match drop highest notation
   *
   * Matches 'H' or 'h' optionally followed by a number
   *
   * @example
   * // Matches: 'H', 'h', 'H1', 'h2', etc.
   * // In notation: '2d20H' - Roll 2d20 and drop the highest
   */
  public static readonly highestPattern: RegExp = /[Hh]\d*/g

  /**
   * Pattern to match drop lowest notation
   *
   * Matches 'L' or 'l' optionally followed by a number
   *
   * @example
   * // Matches: 'L', 'l', 'L1', 'l2', etc.
   * // In notation: '2d20L' - Roll 2d20 and drop the lowest
   */
  public static readonly lowestPattern: RegExp = /[Ll]\d*/g

  /**
   * Pattern to match drop constraints notation
   *
   * Matches 'D' or 'd' followed by a list of constraints in curly braces
   *
   * @example
   * // Matches: 'D{1}', 'd{>3}', 'D{<2,4}', etc.
   * // In notation: '4d6D{1}' - Roll 4d6 and drop any 1s
   */
  public static readonly constraintsPattern: RegExp = new RegExp(
    /[Dd]/.source + /{([<>]?\d+,)*([<>]?\d+)}/.source,
    'g'
  )
  /**
   * Parses constraint-based drop notations (e.g., D{>3,<1,2})
   *
   * @param notations - Array of notation strings to parse
   * @returns Object containing parsed drop constraint options
   */
  public static parseConstraints = (
    notations: string[]
  ): Pick<ModifierOptions, 'drop'> => {
    if (notations.length === 0) {
      return {}
    }
    const dropConstraintParameters: DropOptions = {}

    return notations.reduce(
      (acc, notationString) => {
        const constraints = (notationString.split(/[Dd]/)[1] ?? '')
          .replaceAll('{', '')
          .replaceAll('}', '')
          .split(',')
        const parsedConstraints = constraints.reduce((innerAcc, constraint) => {
          if (constraint.includes('<')) {
            return {
              ...innerAcc,
              lessThan: Number(constraint.split('<')[1])
            }
          }

          if (constraint.includes('>')) {
            return {
              ...innerAcc,
              greaterThan: Number(constraint.split('>')[1])
            }
          }

          const exact = [...(innerAcc.exact ?? []), Number(constraint)]

          return {
            ...innerAcc,
            exact
          }
        }, dropConstraintParameters)

        return {
          drop: {
            ...acc.drop,
            ...parsedConstraints
          }
        }
      },
      { drop: dropConstraintParameters }
    )
  }

  /**
   * Parses drop highest notation (e.g., H or H2)
   *
   * @param notations - Array of notation strings to parse
   * @returns Object containing parsed drop highest options
   */
  public static parseHigh(notations: string[]): Pick<ModifierOptions, 'drop'> {
    if (notations.length === 0) {
      return {}
    }

    const notationString = notations[notations.length - 1] ?? ''
    const highestCount = notationString.split(/[Hh]/)[1]

    if (highestCount === '') {
      return {
        drop: { highest: 1 }
      }
    }

    return {
      drop: { highest: Number(highestCount) }
    }
  }

  /**
   * Parses drop lowest notation (e.g., L or L2)
   *
   * @param notations - Array of notation strings to parse
   * @returns Object containing parsed drop lowest options
   */
  public static parseLow(notations: string[]): Pick<ModifierOptions, 'drop'> {
    if (notations.length === 0) {
      return { drop: {} }
    }
    const notationString = notations[notations.length - 1] ?? ''
    const lowestCount = notationString.split(/[Ll]/)[1]

    if (lowestCount === '') {
      return {
        drop: {
          lowest: 1
        }
      }
    }

    return {
      drop: {
        lowest: Number(lowestCount)
      }
    }
  }

  /**
   * Parses a modifier string to extract all drop options
   *
   * @param modifiersString - The string containing modifier notation
   * @returns Object containing all parsed drop options
   */
  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'drop'> => {
    const dropHighModifiers = DropModifier.parseHigh(
      extractMatches(modifiersString, DropModifier.highestPattern)
    )
    const dropLowModifiers = DropModifier.parseLow(
      extractMatches(modifiersString, DropModifier.lowestPattern)
    )
    const dropConstraintsModifiers = DropModifier.parseConstraints(
      extractMatches(modifiersString, DropModifier.constraintsPattern)
    )

    const rawDropModifiers = {
      drop: {
        ...dropHighModifiers.drop,
        ...dropLowModifiers.drop,
        ...dropConstraintsModifiers.drop
      }
    }

    if (Object.keys(rawDropModifiers.drop).length > 0) {
      return rawDropModifiers
    }
    return {}
  }

  /**
   * Applies the drop modifier to a roll result
   *
   * @param bonus - The current roll bonuses to modify
   * @returns Modified roll bonuses with dropped dice removed
   */
  public apply = (bonus: NumericRollBonus): NumericRollBonus => {
    if (this.options === undefined) return bonus
    const { highest, lowest, greaterThan, lessThan, exact } = this.options
    const sortedResults = bonus.rolls
      .filter(
        (roll) =>
          !(
            (greaterThan !== undefined && roll > greaterThan) ||
            (lessThan !== undefined && roll < lessThan) ||
            exact?.map((number) => number).includes(roll) === true
          )
      )
      .sort((a, b) => a - b)

    if (highest !== undefined) {
      this.times(highest)(() => sortedResults.pop())
    }

    if (lowest !== undefined) {
      this.times(lowest)(() => sortedResults.shift())
    }

    return {
      ...bonus,
      rolls: sortedResults
    }
  }

  /**
   * Generates a human-readable description of the drop modifier
   *
   * @returns Array of description strings or undefined if no drop options
   */
  public toDescription(): string[] | undefined {
    if (this.options === undefined) return undefined
    const dropList = []

    if (this.options.highest && this.options.highest > 1)
      dropList.push(`Drop highest ${String(this.options.highest)}`)

    if (this.options.highest && this.options.highest <= 1)
      dropList.push(`Drop highest`)

    if (this.options.lowest && this.options.lowest > 1)
      dropList.push(`Drop lowest ${String(this.options.lowest)}`)

    if (this.options.lowest && this.options.lowest <= 1)
      dropList.push(`Drop lowest`)

    if (this.options.exact) {
      const exact = formatters.humanList(this.options.exact)
      dropList.push(`Drop ${String(exact)}`)
    }

    formatters.greaterLess
      .descriptions(this.options)
      .forEach((str) => dropList.push(`Drop ${String(str)}`))

    return dropList
  }

  /**
   * Converts the drop modifier to dice notation format
   *
   * @returns Dice notation string or undefined if no drop options
   */
  public toNotation(): string | undefined {
    if (this.options === undefined) return undefined
    const dropList: string[] = []
    const greaterLess = formatters.greaterLess.notation(this.options)
    greaterLess.forEach((str) => dropList.push(str))
    if (this.options.exact) {
      this.options.exact.forEach((roll) => {
        dropList.push(String(roll))
      })
    }

    const finalList = []

    if (this.options.highest && this.options.highest > 1) {
      finalList.push(`H${String(this.options.highest)}`)
    }

    if (this.options.highest && this.options.highest <= 1) {
      finalList.push(`H`)
    }

    if (this.options.lowest && this.options.lowest > 1) {
      finalList.push(`L${String(this.options.lowest)}`)
    }

    if (this.options.lowest && this.options.lowest <= 1) {
      finalList.push(`L`)
    }

    if (dropList.length > 0) {
      finalList.push(`D{${dropList.map((str) => str).join(',')}}`)
    }

    return finalList.join('')
  }

  /**
   * Helper method to execute a callback multiple times
   *
   * @param iterator - Number of times to execute the callback
   * @returns Function that takes a callback to execute
   */
  private times = (iterator: number) => {
    return (callback: (index?: number) => void): void => {
      if (iterator > 0) {
        callback(iterator)
        this.times(iterator - 1)(callback)
      }
    }
  }
}
