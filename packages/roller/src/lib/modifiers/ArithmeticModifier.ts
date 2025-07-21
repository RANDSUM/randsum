import type { ModifierOptions, NumericRollBonus } from '../../types'
import { BaseModifier } from './BaseModifier'

export class ArithmeticModifier extends BaseModifier<number> {
  public static readonly plusPattern: RegExp = /\+\d+(?![dD])/g
  public static readonly minusPattern: RegExp = /-\d+(?![dD])/g

  protected readonly operator: '+' | '-'
  protected readonly operatorName: 'plus' | 'minus'
  protected readonly actionVerb: 'Add' | 'Subtract'

  constructor(options: number | undefined, operator: '+' | '-') {
    super(options)
    this.operator = operator
    this.operatorName = operator === '+' ? 'plus' : 'minus'
    this.actionVerb = operator === '+' ? 'Add' : 'Subtract'
  }

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

  protected static parseArithmeticModifier<T extends 'plus' | 'minus'>(
    modifiersString: string,
    pattern: RegExp,
    operator: '+' | '-',
    key: T
  ): Pick<ModifierOptions, T> {
    const value = this.parseArithmetic(modifiersString, pattern, operator)
    return (value === 0 ? {} : { [key]: value }) as Pick<ModifierOptions, T>
  }

  public static parsePlus(
    modifiersString: string
  ): Pick<ModifierOptions, 'plus'> {
    return this.parseArithmeticModifier(
      modifiersString,
      this.plusPattern,
      '+',
      'plus'
    )
  }

  public static parseMinus(
    modifiersString: string
  ): Pick<ModifierOptions, 'minus'> {
    return this.parseArithmeticModifier(
      modifiersString,
      this.minusPattern,
      '-',
      'minus'
    )
  }

  public static createPlus(value: number | undefined): ArithmeticModifier {
    return new ArithmeticModifier(value, '+')
  }

  public static createMinus(value: number | undefined): ArithmeticModifier {
    return new ArithmeticModifier(value, '-')
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

  public toDescription = (): string[] => {
    if (!this.options) return []
    return [`${this.actionVerb} ${String(this.options)}`]
  }

  public toNotation = (): string => {
    if (!this.options) return ''
    if (this.operator === '+' && this.options < 0) {
      return `-${String(Math.abs(this.options))}`
    }
    return `${this.operator}${String(this.options)}`
  }
}
