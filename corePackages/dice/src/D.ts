import type {
  CustomRollOptions,
  ModifierOptions,
  NumericRollOptions
} from '@randsum/core'
import { RandsumError } from '@randsum/core'
import { roll } from './roll'
import type {
  BaseD,
  CustomDie,
  CustomRollResult,
  NumericDie,
  NumericRollResult
} from './types'
import { coreSpreadRolls } from './utils/coreSpreadRolls'
import { generateNumericFaces } from './utils/generateNumericFaces'

abstract class DieBase {
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

class NumericDieImpl extends DieBase implements NumericDie {
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

class CustomDieImpl extends DieBase implements CustomDie {
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
    modifiers: ModifierOptions = {}
  ): CustomRollResult {
    return roll({
      ...this.toOptions,
      quantity,
      modifiers
    } as CustomRollOptions)
  }

  public get toOptions(): CustomRollOptions {
    return {
      quantity: 1,
      sides: [...this.faces]
    }
  }
}

function D(sides: number): NumericDie

function D(faces: string[]): CustomDie

function D(arg: number | string[]): BaseD {
  if (typeof arg === 'number') {
    return new NumericDieImpl(arg)
  } else {
    return new CustomDieImpl(arg)
  }
}

export const D4: NumericDie = D(4)

export const D6: NumericDie = D(6)

export const D8: NumericDie = D(8)

export const D10: NumericDie = D(10)

export const D12: NumericDie = D(12)

export const D20: NumericDie = D(20)

export const D100: NumericDie = D(100)

export const coin: CustomDie = D(['Heads', 'Tails'])

export const fudgeDice: CustomDie = D(['+', '+', '+', '-', ' ', ' '])

const alphanumFaces = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9'
]

export const alphaNumDie: CustomDie = D(alphanumFaces)

export { D }
