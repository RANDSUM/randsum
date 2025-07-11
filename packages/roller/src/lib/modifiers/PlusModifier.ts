import type { ModifierOptions, NumericRollBonus } from '../../types'
import { BaseModifier } from './BaseModifier'

export class PlusModifier extends BaseModifier<number> {
  public static readonly pattern: RegExp = /\+\d+/g

  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'plus'> => {
    const notations = this.extractMatches(modifiersString, PlusModifier.pattern)
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

  public apply(bonus: NumericRollBonus): NumericRollBonus {
    if (!this.options) return bonus
    const logs = [...bonus.logs, this.toModifierLog('plus', [], [this.options])]
    return {
      rolls: bonus.rolls,
      simpleMathModifier: this.options,
      logs
    }
  }

  public toDescription = (): string[] | undefined => {
    if (!this.options) return undefined
    return [`Add ${String(this.options)}`]
  }

  public toNotation = (): string | undefined => {
    if (!this.options) return undefined
    if (this.options < 0) return `-${String(Math.abs(this.options))}`
    return `+${String(this.options)}`
  }
}
