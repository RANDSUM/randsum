import type {
  ComparisonOptions,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions
} from '../../types/modifiers'
import { BaseModifier } from './BaseModifier'
import { CapModifier } from './CapModifier'

export class ReplaceModifier extends BaseModifier<
  ReplaceOptions | ReplaceOptions[]
> {
  public static readonly pattern: RegExp = this.createBracedReplacementPattern(
    /[Vv]/.source
  )
  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'replace'> => {
    const notations = this.extractMatches(
      modifiersString,
      ReplaceModifier.pattern
    )
    if (notations.length === 0) {
      return {}
    }
    const replace = notations
      .map((notationString) => {
        const replaceOptions = (notationString.split(/[Vv]/)[1] ?? '')
          .replace(/[{}]/g, '')
          .split(',')
          .map((replacement) => {
            const [noteFrom = '', noteTo] = replacement.split('=')

            const coreReplacement = { to: Number(noteTo) }
            if (noteFrom.includes('>')) {
              return {
                ...coreReplacement,
                from: { greaterThan: Number(noteFrom.replace(/>/g, '')) }
              }
            }
            if (noteFrom.includes('<')) {
              return {
                ...coreReplacement,
                from: { lessThan: Number(noteFrom.replace(/</g, '')) }
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

  public apply(bonus: NumericRollBonus): NumericRollBonus {
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

    const logs = [
      ...bonus.logs,
      this.toModifierLog('replace', bonus.rolls, replaceRolls)
    ]

    return {
      rolls: replaceRolls,
      simpleMathModifier: bonus.simpleMathModifier,
      logs
    }
  }

  public toDescription = (): string[] | undefined => {
    if (this.options === undefined) return undefined
    if (Array.isArray(this.options)) {
      return this.options.map(this.singleReplaceDescription)
    }

    return [this.singleReplaceDescription(this.options)]
  }

  public toNotation = (): string | undefined => {
    if (this.options === undefined) return undefined
    const args = this.replaceArgs(this.options)
    return `V{${args.join(',')}}`
  }

  private readonly singleReplaceDescription = ({
    from,
    to
  }: ReplaceOptions): string => {
    return `Replace ${String(this.extractFromValue(from))} with [${String(to)}]`
  }

  private readonly extractFromValue = (
    from: number | ComparisonOptions
  ): string => {
    if (typeof from === 'number') return `[${String(from)}]`
    return this.formatGreaterLessDescription(from).join(' and ')
  }

  private readonly replaceArgs = (
    replace: ReplaceOptions | ReplaceOptions[]
  ): string[] => {
    if (Array.isArray(replace))
      return replace.map(this.singleReplaceNotation).flat()
    return [this.singleReplaceNotation(replace)]
  }

  private readonly singleReplaceNotation = (
    replace: ReplaceOptions
  ): string => {
    return `${String(this.fromValueNotation(replace.from))}=${String(replace.to)}`
  }

  private readonly fromValueNotation = (
    from: number | ComparisonOptions
  ): string | number => {
    if (typeof from === 'number') return from
    return this.formatGreaterLessNotation(from).join(',')
  }
}
