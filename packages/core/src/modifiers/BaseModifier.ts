import type {
  ModifierOptions,
  NumericRollBonus,
  RequiredNumericRollParameters
} from '../types'

export abstract class BaseModifier<T = unknown> {
  protected options: T | undefined

  constructor(options: T | undefined) {
    this.options = options
  }

  abstract apply(
    bonuses: NumericRollBonus,
    parameters?: RequiredNumericRollParameters,
    rollOne?: () => number
  ): NumericRollBonus

  abstract toDescription(): string[] | undefined

  abstract toNotation(): string | undefined

   
  static parse(_modifiersString: string): Partial<ModifierOptions> {
    return {}
  }
}
