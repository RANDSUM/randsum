import type { ModifierOptions } from '../../types'
import { ArithmeticModifier } from './ArithmeticModifier'

export class PlusModifier extends ArithmeticModifier {
  public static readonly pattern: RegExp = /\+\d+/g
  protected readonly operator = '+' as const
  protected readonly operatorName = 'plus' as const
  protected readonly actionVerb = 'Add' as const

  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'plus'> => {
    const plus = this.parseArithmetic(
      modifiersString,
      PlusModifier.pattern,
      '+'
    )

    return plus === 0 ? {} : { plus }
  }
}
