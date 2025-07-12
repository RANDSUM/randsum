import type { NumericRollBonus } from '../../types'
import { BaseModifier } from './BaseModifier'

export abstract class ArithmeticModifier extends BaseModifier<number> {
  protected abstract readonly operator: '+' | '-'
  protected abstract readonly operatorName: 'plus' | 'minus'
  protected abstract readonly actionVerb: 'Add' | 'Subtract'

  public static parseArithmetic(
    modifiersString: string,
    pattern: RegExp,
    operator: '+' | '-'
  ): number {
    const notations = this.extractMatches(modifiersString, pattern)
    if (notations.length === 0) {
      return 0
    }

    return notations
      .map((notationString) => Number(notationString.split(operator)[1]))
      .reduce((acc, num) => acc + num, 0)
  }

  public apply(bonus: NumericRollBonus): NumericRollBonus {
    if (!this.options) return bonus

    const value = this.operator === '+' ? this.options : -this.options
    const logs = [
      ...bonus.logs,
      this.toModifierLog(this.operatorName, [], [value])
    ]

    return {
      rolls: bonus.rolls,
      simpleMathModifier: value,
      logs
    }
  }

  public toDescription = (): string[] | undefined => {
    if (!this.options) return undefined
    return [`${this.actionVerb} ${String(this.options)}`]
  }

  public toNotation = (): string | undefined => {
    if (this.options === 0) return '+0'
    if (!this.options) return undefined
    if (this.operator === '+' && this.options < 0) {
      return `-${String(Math.abs(this.options))}`
    }
    return `${this.operator}${String(this.options)}`
  }
}
