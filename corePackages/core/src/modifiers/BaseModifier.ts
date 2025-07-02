import type {
  ModifierConfig,
  ModifierOptions,
  NumericRollBonus,
  RequiredNumericRollParameters
} from '../types'

export abstract class BaseModifier<T extends ModifierConfig = ModifierConfig> {
  protected options: T | undefined

  constructor(options: T | undefined) {
    this.options = options
  }

  public abstract apply(
    bonuses: NumericRollBonus,
    parameters?: RequiredNumericRollParameters,
    rollOne?: () => number
  ): NumericRollBonus

  public abstract toDescription(): string[] | undefined

  public abstract toNotation(): string | undefined

  public static parse(_modifiersString: string): Partial<ModifierOptions> {
    return {}
  }
}
