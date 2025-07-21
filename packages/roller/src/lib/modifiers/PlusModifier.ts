import type { ModifierOptions } from '../../types'
import { ArithmeticModifier } from './ArithmeticModifier'

export class PlusModifier extends ArithmeticModifier {
  public static readonly pattern: RegExp = ArithmeticModifier.plusPattern
  protected readonly operator = '+' as const
  protected readonly operatorName = 'plus' as const
  protected readonly actionVerb = 'Add' as const

  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'plus'> => {
    return this.parseArithmeticModifier(
      modifiersString,
      this.pattern,
      '+',
      'plus'
    )
  }
}
