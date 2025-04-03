import { rerollPattern } from '../patterns'
import type { ModifierOptions, NumericRollBonus, RerollOptions } from '../types'
import { extractMatches } from '../utils/extractMatches'
import { formatters } from '../utils/formatters'
import { BaseModifier } from './BaseModifier'

/**
 * Modifier that rerolls dice matching specific criteria
 *
 * The RerollModifier allows rerolling dice that match certain conditions:
 * - Exact values
 * - Values greater than a threshold
 * - Values less than a threshold
 *
 * It can also limit the number of rerolls with a max parameter.
 *
 * @example
 * // Reroll any 1s
 * const rerollMod = new RerollModifier({ exact: [1] });
 *
 * // Reroll any value less than 3, up to 2 times
 * const rerollLowMod = new RerollModifier({ lessThan: 3, max: 2 });
 */
export class RerollModifier extends BaseModifier<RerollOptions> {
  /**
   * Parses a modifier string to extract reroll options
   *
   * @param modifiersString - The string containing modifier notation
   * @returns Object containing parsed reroll options
   */
  public static override parse(
    modifiersString: string
  ): Pick<ModifierOptions, 'replace'> {
    const notations = extractMatches(modifiersString, rerollPattern)
    if (notations.length === 0) {
      return {}
    }

    return notations.reduce(
      (acc, notationString) => {
        const parsedString = (notationString.split(/[Rr]/)[1] ?? '')
          .replaceAll('{', '')
          .replaceAll('}', ',!')
          .split(',')

        const rerollOptions = parsedString.reduce<RerollOptions>(
          (innerAcc, notation) => {
            if (notation === '!') {
              return innerAcc
            }
            if (notation.includes('<')) {
              return {
                ...innerAcc,
                lessThan: Number(notation.split('<')[1])
              }
            }
            if (notation.includes('>')) {
              return {
                ...innerAcc,
                greaterThan: Number(notation.split('>')[1])
              }
            }
            if (notation.includes('!')) {
              return {
                ...innerAcc,
                max: Number(notation.split('!')[1])
              }
            }

            return {
              ...innerAcc,
              exact: [...(innerAcc.exact ?? []), Number(notation)]
            }
          },
          {}
        )

        return {
          reroll: {
            ...acc.reroll,
            ...rerollOptions
          }
        }
      },
      { reroll: {} }
    ) as Pick<ModifierOptions, 'replace'>
  }

  /**
   * Applies the reroll modifier to a roll result
   *
   * @param bonus - The current roll bonuses to modify
   * @param _params - Unused parameter
   * @param rollOne - Function to roll a single die
   * @returns Modified roll bonuses with rerolled values
   */
  public apply(
    bonus: NumericRollBonus,
    _params: undefined,
    rollOne: () => number
  ): NumericRollBonus {
    if (this.options === undefined) return bonus

    return {
      ...bonus,
      rolls: [...bonus.rolls].map((roll) => {
        if (this.options === undefined) return roll
        return this.rerollRoll(roll, this.options, rollOne)
      })
    }
  }

  /**
   * Generates a human-readable description of the reroll modifier
   *
   * @returns Array of description strings or undefined if no reroll options
   */
  public toDescription(): string[] | undefined {
    if (this.options === undefined) return undefined
    const rerollList: string[] = []

    if (this.options.exact) {
      this.options.exact.forEach((roll) => {
        rerollList.push(String(roll))
      })
    }
    const greaterLess = formatters.greaterLess
      .descriptions(this.options)
      .join(' and ')

    const exactList = formatters.humanList(rerollList)

    const exactString = [exactList, greaterLess]
      .filter((i) => i !== '')
      .join(', ')

    if (exactString === '') return undefined
    const coreString = `Reroll ${exactString}`

    if (this.options.max) {
      return [`${coreString} (up to ${String(this.options.max)} times)`]
    }

    return [coreString]
  }

  /**
   * Converts the reroll modifier to dice notation format
   *
   * @returns Dice notation string or undefined if no reroll options
   */
  public toNotation(): string | undefined {
    if (this.options === undefined) return undefined
    const rerollList = []

    if (this.options.exact) {
      this.options.exact.forEach((roll) => {
        rerollList.push(String(roll))
      })
    }
    const greaterLess = formatters.greaterLess.notation(this.options)
    if (greaterLess.length > 0) {
      rerollList.push(greaterLess.join(','))
    }

    if (rerollList.length === 0) return ''
    return `R{${rerollList.join(',')}}${String(this.maxNotation(this.options.max))}`
  }

  /**
   * Checks if a roll value matches any of the exact values to reroll
   *
   * @param exact - Array of exact values to check against
   * @param roll - The roll value to check
   * @returns True if the roll should be rerolled
   */
  private extractExactValue(
    exact: number[] | undefined,
    roll: number
  ): boolean {
    if (exact === undefined) {
      return false
    }
    return exact.includes(roll)
  }

  /**
   * Formats the max reroll count for notation
   *
   * @param max - Maximum number of rerolls
   * @returns Formatted string for max rerolls
   */
  private maxNotation(max: number | undefined): string {
    if (max === undefined) return ''
    return String(max)
  }

  /**
   * Recursively rerolls a die until it no longer matches reroll criteria
   * or reaches the maximum number of rerolls
   *
   * @param roll - The current roll value
   * @param param1 - Reroll options with criteria
   * @param rollOne - Function to roll a single die
   * @param index - Current reroll count
   * @returns Final roll value after rerolls
   */
  private rerollRoll(
    roll: number,
    { greaterThan, lessThan, exact, max }: RerollOptions,
    rollOne: () => number,
    index = 0
  ): number {
    if (max === index) {
      return roll
    }
    if (index === 99) {
      return roll
    }

    if (
      (greaterThan !== undefined && roll > greaterThan) ||
      (lessThan !== undefined && roll < lessThan) ||
      this.extractExactValue(exact, roll)
    ) {
      return this.rerollRoll(
        rollOne(),
        {
          greaterThan,
          lessThan,
          exact,
          max
        } as RerollOptions,
        rollOne,
        index + 1
      )
    }
    return roll
  }
}
