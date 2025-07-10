import type { ModifierOptions } from '../../types'
import { ArithmeticModifier } from './ArithmeticModifier'

export class MinusModifier extends ArithmeticModifier {
  public static readonly pattern: RegExp = /-\d+/g
  protected readonly operator = '-' as const
  protected readonly operatorName = 'minus' as const
  protected readonly actionVerb = 'Subtract' as const

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
}
