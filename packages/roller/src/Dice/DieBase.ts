import type {
  CustomRollOptions,
  CustomRollResult,
  ModifierOptions,
  NumericRollOptions,
  NumericRollResult
} from '../types'

export abstract class DieBase {
  public readonly sides: number
  public abstract readonly type: 'numeric' | 'custom'
  public abstract readonly faces: number[] | string[]
  public abstract readonly isCustom: boolean

  constructor(sides: number) {
    this.sides = sides
  }

  public abstract roll(quantity?: number): number | string
  public abstract rollSpread(quantity?: number): number[] | string[]
  public abstract rollModified(
    quantity: number,
    modifiers?: ModifierOptions
  ): NumericRollResult | CustomRollResult
  public abstract get toOptions(): NumericRollOptions | CustomRollOptions
}
