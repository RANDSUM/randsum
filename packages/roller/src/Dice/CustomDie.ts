import { coreSpreadRolls } from '../lib'
import { roll } from '../roll'
import type {
  CustomDieInterface,
  CustomRollOptions,
  CustomRollResult,
  ModifierOptions
} from '../types'
import { DieBase } from './DieBase'

export class CustomDie extends DieBase implements CustomDieInterface {
  public readonly type = 'custom' as const
  public readonly faces: string[]
  public readonly isCustom = true as const

  constructor(faces: string[]) {
    if (!faces.length) {
      throw new Error('Custom die must have at least one face')
    }
    super(faces.length)
    this.faces = [...faces]
  }

  public roll(quantity = 1): string {
    const rolls = this.rollSpread(quantity)
    return rolls.join(', ')
  }

  public rollSpread(quantity = 1): string[] {
    return coreSpreadRolls<string>(quantity, this.sides, this.faces)
  }

  public rollModified(
    quantity = 1,
    _modifiers: ModifierOptions = {}
  ): CustomRollResult {
    const options: CustomRollOptions = {
      ...this.toOptions,
      quantity
    }
    return roll(options)
  }

  public get toOptions(): CustomRollOptions {
    return {
      quantity: 1,
      sides: [...this.faces]
    }
  }
}
