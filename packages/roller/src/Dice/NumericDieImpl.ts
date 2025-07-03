import { coreSpreadRolls, generateNumericFaces } from '../lib'
import { roll } from '../roll'
import type {
  ModifierOptions,
  NumericDie,
  NumericRollOptions,
  NumericRollResult
} from '../types'
import { DieBase } from './DieBase'

export class NumericDieImpl extends DieBase implements NumericDie {
  public readonly type = 'numeric' as const
  public readonly faces: number[]
  public readonly isCustom = false as const

  constructor(sides: number) {
    super(sides)
    this.faces = generateNumericFaces(sides)
  }

  public roll(quantity = 1): number {
    const rolls = this.rollSpread(quantity)
    return rolls.reduce((acc, roll) => acc + roll, 0)
  }

  public rollSpread(quantity = 1): number[] {
    return coreSpreadRolls<number>(quantity, this.sides, this.faces)
  }

  public rollModified(
    quantity = 1,
    modifiers: ModifierOptions = {}
  ): NumericRollResult {
    const options = { ...this.toOptions, quantity, modifiers }
    return roll(options)
  }

  public get toOptions(): NumericRollOptions {
    return {
      quantity: 1,
      sides: this.sides
    }
  }
}
