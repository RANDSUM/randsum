import { RandsumError, coreSpreadRolls } from '../lib'
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
      throw new RandsumError(
        'Custom die must have at least one face',
        'INVALID_DIE_CONFIG',
        {
          input: faces,
          expected: 'Array with at least one face value'
        },
        [
          'Provide at least one face value: ["H", "T"] for a coin',
          'Use standard dice like D6 if you need numbered faces',
          'Custom faces must be non-empty strings'
        ]
      )
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
