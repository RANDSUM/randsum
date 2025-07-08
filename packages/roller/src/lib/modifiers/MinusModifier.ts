import type { ModifierOptions, NumericRollBonus } from '../../types'
import { BaseModifier } from './BaseModifier'

export class MinusModifier extends BaseModifier<number> {
  public static readonly pattern: RegExp = /-\d+/g

  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'minus'> => {
    const notations = this.extractMatches(
      modifiersString,
      MinusModifier.pattern
    )
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

  public apply(bonus: NumericRollBonus): NumericRollBonus {
    if (!this.options) return bonus

    const logs = [
      ...bonus.logs,
      this.toModifierLog('minus', [], [-this.options])
    ]

    return {
      rolls: bonus.rolls,
      simpleMathModifier: -this.options,
      logs
    }
  }

  public toDescription = (): string[] | undefined => {
    if (!this.options) return undefined
    return [`Subtract ${String(this.options)}`]
  }

  public toNotation = (): string | undefined => {
    if (!this.options) return undefined
    return `-${String(this.options)}`
  }
}
