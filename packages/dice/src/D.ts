/**
 * @file Core die class implementation for RANDSUM
 * @module @randsum/dice/D
 */

import type {
  CustomRollOptions,
  ModifierOptions,
  NumericRollOptions
} from '@randsum/core'
import { RandsumError, RandsumErrorCode } from '@randsum/core'
import { roll } from './roll'
import type { BaseD, CustomDie, CustomRollResult, NumericDie, NumericRollResult } from './types'
import { coreSpreadRolls } from './utils/coreSpreadRolls'
import { generateNumericalFaces } from './utils/generateNumericalFaces'

/**
 * Abstract base class for all dice implementations
 * @internal
 */
abstract class DieBase {
  public readonly sides: number
  public abstract readonly type: 'numerical' | 'custom'
  public abstract readonly faces: number[] | string[]
  public abstract readonly isCustom: boolean

  constructor(sides: number) {
    this.sides = sides
  }

  public abstract roll(quantity?: number): number | string
  public abstract rollSpread(quantity?: number): number[] | string[]
  public abstract rollModified(quantity: number, modifiers?: ModifierOptions): NumericRollResult | CustomRollResult
  public abstract get toOptions(): NumericRollOptions | CustomRollOptions
}

/**
 * Implementation class for numeric dice
 * @internal
 */
class NumericDieImpl extends DieBase implements NumericDie {
  public readonly type = 'numerical' as const
  public readonly faces: number[]
  public readonly isCustom = false as const

  constructor(sides: number) {
    super(sides)
    this.faces = generateNumericalFaces(sides)
  }

  /**
   * Rolls the die and returns the sum of all dice rolled
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @returns Sum of all dice rolled
   */
  public roll(quantity = 1): number {
    const rolls = this.rollSpread(quantity)
    return rolls.reduce((acc, roll) => acc + roll, 0)
  }

  /**
   * Rolls the die multiple times and returns an array of individual results
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @returns Array of individual roll results
   */
  public rollSpread(quantity = 1): number[] {
    return coreSpreadRolls<number>(quantity, this.sides, this.faces)
  }

  /**
   * Rolls the die with modifiers and returns a detailed result object
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @param modifiers - Modifiers to apply to the roll (default: {})
   * @returns Detailed roll result object
   */
  public rollModified(
    quantity = 1,
    modifiers: ModifierOptions = {}
  ): NumericRollResult {
    return roll({
      ...this.toOptions,
      quantity,
      modifiers
    } as NumericRollOptions)
  }

  /**
   * Converts the die to roll options format
   *
   * @returns Roll options object for this die
   */
  public get toOptions(): NumericRollOptions {
    return {
      quantity: 1,
      sides: this.sides
    }
  }
}

/**
 * Implementation class for custom dice
 * @internal
 */
class CustomDieImpl extends DieBase implements CustomDie {
  public readonly type = 'custom' as const
  public readonly faces: string[]
  public readonly isCustom = true as const

  constructor(faces: string[]) {
    if (!faces.length) {
      throw new RandsumError(
        'Custom die must have at least one face',
        RandsumErrorCode.INVALID_DIE_CONFIG,
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

  /**
   * Rolls the die and returns a comma-separated string of all faces rolled
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @returns Comma-separated string of results
   */
  public roll(quantity = 1): string {
    const rolls = this.rollSpread(quantity)
    return rolls.join(', ')
  }

  /**
   * Rolls the die multiple times and returns an array of individual results
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @returns Array of individual roll results
   */
  public rollSpread(quantity = 1): string[] {
    return coreSpreadRolls<string>(quantity, this.sides, this.faces)
  }

  /**
   * Rolls the die with modifiers and returns a detailed result object
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @param modifiers - Modifiers to apply to the roll (default: {})
   * @returns Detailed roll result object
   */
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

  /**
   * Converts the die to roll options format
   *
   * @returns Roll options object for this die
   */
  public get toOptions(): CustomRollOptions {
    return {
      quantity: 1,
      sides: [...this.faces]
    }
  }
}

/**
 * Factory function to create numeric dice
 *
 * @param sides - Number of sides on the die
 * @returns A numeric die instance
 *
 * @example
 * // Create a d20
 * const d20 = D(20);
 * d20.roll(); // Returns a number between 1-20
 */
function D(sides: number): NumericDie

/**
 * Factory function to create custom dice
 *
 * @param faces - Array of string faces for the die
 * @returns A custom die instance
 *
 * @example
 * // Create a coin
 * const coin = D(['Heads', 'Tails']);
 * coin.roll(); // Returns either "Heads" or "Tails"
 */
function D(faces: string[]): CustomDie

/**
 * Factory function to create dice (implementation)
 *
 * @param arg - Either number of sides or array of faces
 * @returns A die instance (numeric or custom)
 */
function D(arg: number | string[]): BaseD {
  if (typeof arg === 'number') {
    return new NumericDieImpl(arg)
  } else {
    return new CustomDieImpl(arg)
  }
}

/**
 * A four-sided die (tetrahedron)
 * Commonly used in tabletop RPGs for small damage values
 */
export const D4: NumericDie = D(4)

/**
 * A six-sided die (cube)
 * The most common die type, used in many games
 */
export const D6: NumericDie = D(6)

/**
 * An eight-sided die (octahedron)
 * Often used for medium weapon damage in tabletop RPGs
 */
export const D8: NumericDie = D(8)

/**
 * A ten-sided die (pentagonal trapezohedron)
 * Used in many RPGs and for percentile rolls when paired with another D10
 */
export const D10: NumericDie = D(10)

/**
 * A twelve-sided die (dodecahedron)
 * Used in many RPGs for larger weapons and special abilities
 */
export const D12: NumericDie = D(12)

/**
 * A twenty-sided die (icosahedron)
 * The iconic die for Dungeons & Dragons and many other RPGs
 * Used for attack rolls, saving throws, and skill checks
 */
export const D20: NumericDie = D(20)

/**
 * A percentile die (simulated with two D10s)
 * Used for percentage checks and random tables
 * Generates a number between 1-100
 */
export const D100: NumericDie = D(100)

/**
 * A two-sided coin with "Heads" and "Tails" faces
 * Used for binary decisions or simple 50/50 probability
 */
export const coin: CustomDie = D(['Heads', 'Tails'])

/**
 * Fudge/Fate dice with plus, minus, and blank faces
 * Used in Fate RPG system and its derivatives
 * Has 3 '+' faces, 2 blank faces, and 1 '-' face
 */
export const fudgeDice: CustomDie = D(['+', '+', '+', '-', ' ', ' '])

/**
 * Array of all alphanumeric characters (A-Z, a-z, 0-9)
 * Used as faces for the alphaNumDie
 */
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

/**
 * A 62-sided die with all alphanumeric characters
 * Contains uppercase letters (A-Z), lowercase letters (a-z), and digits (0-9)
 * Useful for generating random characters, IDs, or for games requiring letter/number selection
 */
export const alphaNumDie: CustomDie = D(alphanumFaces)

// Export the factory function
export { D }
