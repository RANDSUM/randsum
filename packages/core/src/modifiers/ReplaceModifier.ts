import type {
  ComparisonOptions,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions
} from '../types'
import { extractMatches } from '../utils/extractMatches'
import { formatters } from '../utils/formatters'
import { BaseModifier } from './BaseModifier'
import { CapModifier } from './CapModifier'

/**
 * Modifier that replaces specific dice values with other values
 *
 * The ReplaceModifier can replace dice values based on exact matches
 * or comparison conditions (greater than, less than). This is useful for
 * systems that treat certain values specially, like critical hits or fumbles.
 *
 * @example
 * // Replace all 1s with 2s
 * const replaceMod = new ReplaceModifier({ from: 1, to: 2 });
 *
 * // Replace all values greater than 18 with 18 (capping high rolls)
 * const capHighMod = new ReplaceModifier({ from: { greaterThan: 18 }, to: 18 });
 */
export class ReplaceModifier extends BaseModifier<
  ReplaceOptions | ReplaceOptions[]
> {
  /**
   * Pattern to match replace modifier notation
   *
   * Matches 'V' or 'v' followed by a list of replacement rules in curly braces
   *
   * @example
   * // Matches: 'V{1=2}', 'v{>18=18}', etc.
   * // In notation: '3d6V{1=2}' - Roll 3d6 and replace all 1s with 2s
   */
  public static readonly pattern: RegExp = new RegExp(
    /[Vv]/.source + /{([<>]?\d+=\d+,)*([<>]?\d+=\d+)}/.source,
    'g'
  )
  /**
   * Parses a modifier string to extract replace options
   *
   * @param modifiersString - The string containing modifier notation
   * @returns Object containing parsed replace options
   */
  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'replace'> => {
    const notations = extractMatches(modifiersString, ReplaceModifier.pattern)
    if (notations.length === 0) {
      return {}
    }
    const replace = notations
      .map((notationString) => {
        const replaceOptions = (notationString.split(/[Vv]/)[1] ?? '')
          .replaceAll('{', '')
          .replaceAll('}', '')
          .split(',')
          .map((replacement) => {
            const [noteFrom = '', noteTo] = replacement.split('=')

            const coreReplacement = { to: Number(noteTo) }
            if (noteFrom.includes('>')) {
              return {
                ...coreReplacement,
                from: { greaterThan: Number(noteFrom.replaceAll('>', '')) }
              }
            }
            if (noteFrom.includes('<')) {
              return {
                ...coreReplacement,
                from: { lessThan: Number(noteFrom.replaceAll('<', '')) }
              }
            }
            return { ...coreReplacement, from: Number(noteFrom) }
          })

        if (replaceOptions.length === 1) {
          return replaceOptions[0]
        }
        return replaceOptions.filter(Boolean)
      })
      .flat()
      .filter((r) => r !== undefined)

    return { replace }
  }

  /**
   * Applies the replace modifier to a roll result
   *
   * @param bonus - The current roll bonuses to modify
   * @returns Modified roll bonuses with replaced values
   */
  public apply = (bonus: NumericRollBonus): NumericRollBonus => {
    if (this.options === undefined) return bonus
    let replaceRolls = bonus.rolls
    const parameters = [this.options].flat()

    parameters.forEach(({ from, to }) => {
      replaceRolls = replaceRolls.map((roll) => {
        if (typeof from === 'object') {
          return CapModifier.applySingleCap(from, to)(roll)
        }
        if (roll === from) {
          return to
        }
        return roll
      })
    })

    return {
      ...bonus,
      rolls: replaceRolls
    }
  }

  /**
   * Generates a human-readable description of the replace modifier
   *
   * @returns Array of description strings or undefined if no replace options
   */
  public toDescription = (): string[] | undefined => {
    if (this.options === undefined) return undefined
    if (Array.isArray(this.options)) {
      return this.options.map(this.singleReplaceDescription)
    }

    return [this.singleReplaceDescription(this.options)]
  }

  /**
   * Converts the replace modifier to dice notation format
   *
   * @returns Dice notation string or undefined if no replace options
   */
  public toNotation = (): string | undefined => {
    if (this.options === undefined) return undefined
    const args = this.replaceArgs(this.options)
    return `V{${args.join(',')}}`
  }

  /**
   * Creates a description for a single replacement rule
   *
   * @param param0 - The replacement options with from and to values
   * @returns Human-readable description string
   */
  private singleReplaceDescription = ({ from, to }: ReplaceOptions): string => {
    return `Replace ${String(this.extractFromValue(from))} with [${String(to)}]`
  }

  /**
   * Extracts a human-readable value from a 'from' condition
   *
   * @param from - The value or condition to extract from
   * @returns Formatted string representation
   */
  private extractFromValue = (from: number | ComparisonOptions): string => {
    if (typeof from === 'number') return `[${String(from)}]`
    return formatters.greaterLess.descriptions(from).join(' and ')
  }

  /**
   * Converts replacement options to notation arguments
   *
   * @param replace - Single replacement rule or array of rules
   * @returns Array of notation strings
   */
  private replaceArgs = (
    replace: ReplaceOptions | ReplaceOptions[]
  ): string[] => {
    if (Array.isArray(replace))
      return replace.map(this.singleReplaceNotation).flat()
    return [this.singleReplaceNotation(replace)]
  }

  /**
   * Creates notation for a single replacement rule
   *
   * @param replace - The replacement options with from and to values
   * @returns Notation string for the replacement
   */
  private singleReplaceNotation = (replace: ReplaceOptions): string => {
    return `${String(this.fromValueNotation(replace.from))}=${String(replace.to)}`
  }

  /**
   * Converts a 'from' condition to notation format
   *
   * @param from - The value or condition to convert
   * @returns Notation representation of the condition
   */
  private fromValueNotation = (
    from: number | ComparisonOptions
  ): string | number => {
    if (typeof from === 'number') return from
    return formatters.greaterLess.notation(from).join(',')
  }
}
