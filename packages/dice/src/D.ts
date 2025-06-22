/**
 * @file Core die class implementation for RANDSUM
 * @module @randsum/dice/D
 */

import type {
  CustomRollOptions,
  ModifierOptions,
  NumericRollOptions
} from '@randsum/core'
import { roll } from './roll'
import type { BaseD, CustomDie, CustomRollResult, NumericDie, NumericRollResult } from './types'
import { coreSpreadRolls } from './utils/coreSpreadRolls'
import { generateNumericalFaces } from './utils/generateNumericalFaces'

/**
 * Internal implementation for numeric dice
 * @internal
 */
class NumericDieImpl implements NumericDie {
  public readonly type = 'numerical' as const
  public readonly isCustom = false as const
  public readonly sides: number
  public readonly faces: number[]

  /**
   * Creates a new numeric die instance
   *
   * @param sides - Number of sides (e.g., 6 for a d6)
   * @throws {Error} If the die has less than 1 side or a non-integer number of sides
   */
  constructor(sides: number) {
    if (!Number.isInteger(sides) || sides < 1) {
      throw new Error(
        'Die must have at least one side with a positive integer value'
      )
    }
    this.sides = sides
    this.faces = generateNumericalFaces(sides)
  }

  /**
   * Rolls the die and returns the sum of all dice rolled
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @returns Sum of all rolls
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
 * Internal implementation for custom dice
 * @internal
 */
class CustomDieImpl implements CustomDie {
  public readonly type = 'custom' as const
  public readonly isCustom = true as const
  public readonly sides: number
  public readonly faces: string[]

  /**
   * Creates a new custom die instance
   *
   * @param faces - Array of string faces (e.g., ['Heads', 'Tails'] for a coin)
   * @throws {Error} If the die has no faces
   */
  constructor(faces: string[]) {
    if (!faces.length) {
      throw new Error('Custom die must have at least one face')
    }
    this.sides = faces.length
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
 * Core die class that represents a single die with numeric or custom faces
 *
 * The D class is the foundation of the RANDSUM dice system. It can represent
 * both standard numeric dice (d4, d6, d8, etc.) and custom dice with string faces
 * (like coins, color dice, etc.).
 *
 * The class uses constructor overloads to provide type-safe operations for both variants.
 *
 * @example
 * // Create a standard d20
 * const d20 = D(20);
 * d20.roll(); // Returns a number between 1-20
 *
 * @example
 * // Create a custom coin with heads and tails
 * const coin = D(['Heads', 'Tails']);
 * coin.roll(); // Returns either "Heads" or "Tails"
 */
export function D(sides: number): NumericDie
export function D(faces: string[]): CustomDie
export function D(arg: number | string[]): BaseD {
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
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
]

/**
 * A 62-sided die with all alphanumeric characters
 * Contains uppercase letters (A-Z), lowercase letters (a-z), and digits (0-9)
 * Useful for generating random characters, IDs, or for games requiring letter/number selection
 */
export const alphaNumDie: CustomDie = D(alphanumFaces)
