import type { ModifierOptions, NumericRollBonus } from '../types'
import { extractMatches } from '../utils/extractMatches'
import { BaseModifier } from './BaseModifier'

export class PlusModifier extends BaseModifier<number> {
  public static readonly pattern: RegExp = /\+\d+/g

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

  public apply = (bonus: NumericRollBonus): NumericRollBonus => {
    if (!this.options) return bonus
    return {
      ...bonus,
      simpleMathModifier: this.options
    }
  }

  public toDescription = (): string[] | undefined => {
    if (!this.options) return undefined
    return [`Add ${String(this.options)}`]
  }

  public toNotation = (): string | undefined => {
    if (!this.options) return undefined
    return `+${String(this.options)}`
  }
}
