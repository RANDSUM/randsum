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
    const minus = this.parseArithmetic(
      modifiersString,
      MinusModifier.pattern,
      '-'
    )
    return minus === 0 ? {} : { minus }
  }
}
