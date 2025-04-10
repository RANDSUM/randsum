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
import type { BaseD, CustomRollResult, NumericRollResult } from './types'
import { coreSpreadRolls } from './utils/coreSpreadRolls'
import { generateNumericalFaces } from './utils/generateNumericalFaces'

/**
 * Core die class that represents a single die with numeric or custom faces
 *
 * The D class is the foundation of the RANDSUM dice system. It can represent
 * both standard numeric dice (d4, d6, d8, etc.) and custom dice with string faces
 * (like coins, color dice, etc.).
 *
 * The class uses a generic type parameter to differentiate between numeric and
 * custom dice, providing type-safe operations for both variants.
 *
 * @example
 * // Create a standard d20
 * const d20 = new D(20);
 * d20.roll(); // Returns a number between 1-20
 *
 * @example
 * // Create a custom coin with heads and tails
 * const coin = new D(['Heads', 'Tails']);
 * coin.roll(); // Returns either "Heads" or "Tails"
 *
 * @template T - Type of die: number for standard dice, string[] for custom dice
 * @implements {BaseD<T>}
 */
export class D<T extends number | string[]> implements BaseD<T> {
  /**
   * Number of sides on the die
   *
   * For numeric dice, this is the highest possible roll value.
   * For custom dice, this is the number of unique faces.
   */
  public readonly sides: number

  /**
   * Array of all possible face values
   *
   * For numeric dice, this is an array of numbers from 1 to sides.
   * For custom dice, this is the array of string values provided at creation.
   */
  public readonly faces: T extends number ? number[] : string[]

  /**
   * Type of die: 'numerical' for standard dice, 'custom' for string-faced dice
   *
   * This property helps determine how rolls should be processed and displayed.
   */
  public readonly type: T extends number ? 'numerical' : 'custom'

  /**
   * Whether this is a custom die with string faces
   *
   * Convenience boolean property that's true for custom dice, false for numeric dice.
   */
  public readonly isCustom: T extends number ? false : true

  /**
   * Creates a new die instance
   *
   * @param arg - For numeric dice, the number of sides (e.g., 6 for a d6).
   *             For custom dice, an array of string faces (e.g., ['Heads', 'Tails'] for a coin).
   * @throws {Error} If a numeric die has less than 1 side or a non-integer number of sides
   * @throws {Error} If a custom die has no faces
   */
  constructor(arg: T) {
    if (typeof arg === 'number') {
      if (!Number.isInteger(arg) || arg < 1) {
        throw new Error(
          'Die must have at least one side with a positive integer value'
        )
      }
      this.sides = arg
      this.faces = generateNumericalFaces(arg) as T extends number
        ? number[]
        : string[]
      this.type = 'numerical' as T extends number ? 'numerical' : 'custom'
      this.isCustom = false as T extends number ? false : true
    } else {
      if (!arg.length) {
        throw new Error('Custom die must have at least one face')
      }

      this.sides = arg.length
      //eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      this.faces = [...(arg as string[])] as T extends number
        ? number[]
        : string[]
      this.type = 'custom' as T extends number ? 'numerical' : 'custom'
      this.isCustom = true as T extends number ? false : true
    }
  }

  /**
   * Rolls the die and returns the result
   *
   * For numeric dice, returns the sum of all dice rolled.
   * For custom dice, returns a comma-separated string of all faces rolled.
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @returns For numeric dice, the sum of all rolls. For custom dice, a comma-separated string of results.
   *
   * @example
   * // Roll a d20
   * const d20 = new D(20);
   * const result = d20.roll(); // Returns a number between 1-20
   *
   * @example
   * // Roll 3d6
   * const d6 = new D(6);
   * const result = d6.roll(3); // Returns sum of 3 dice (3-18)
   *
   * @example
   * // Roll a custom die
   * const colorDie = new D(['Red', 'Green', 'Blue']);
   * const result = colorDie.roll(); // Returns one of: "Red", "Green", or "Blue"
   */
  public roll(quantity = 1): T extends number ? number : string {
    const rolls = this.rollSpread(quantity)
    if (this.type === 'numerical') {
      return (rolls as number[]).reduce(
        (acc, roll) => acc + roll,
        0
      ) as T extends number ? number : string
    }
    return (rolls as string[]).join(', ') as T extends number ? number : string
  }

  /**
   * Rolls the die multiple times and returns an array of individual results
   *
   * Unlike roll(), this method returns the individual values of each die rolled
   * rather than combining them into a sum or string.
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @returns Array of individual roll results
   *
   * @example
   * // Roll 3d6 and get individual results
   * const d6 = new D(6);
   * const results = d6.rollSpread(3); // Returns e.g., [4, 2, 6]
   *
   * @example
   * // Roll a custom die multiple times
   * const colorDie = new D(['Red', 'Green', 'Blue']);
   * const results = colorDie.rollSpread(2); // Returns e.g., ['Red', 'Blue']
   */
  public rollSpread(quantity = 1): T extends number ? number[] : string[] {
    return coreSpreadRolls<string | number>(
      quantity,
      this.sides,
      this.faces
    ) as T extends number ? number[] : string[]
  }

  /**
   * Rolls the die with modifiers and returns a detailed result object
   *
   * This method provides access to the full range of dice modifiers and returns
   * a comprehensive result object with detailed information about the roll.
   *
   * @param quantity - Number of dice to roll (default: 1)
   * @param modifiers - Modifiers to apply to the roll (default: {})
   * @returns Detailed roll result object
   *
   * @example
   * // Roll with advantage (drop lowest)
   * const d20 = new D(20);
   * const result = d20.rollModified(2, { drop: { lowest: 1 } });
   *
   * @example
   * // Roll with exploding dice
   * const d6 = new D(6);
   * const result = d6.rollModified(3, { explode: true });
   */
  public rollModified(
    quantity = 1,
    modifiers: ModifierOptions = {}
  ): T extends number ? NumericRollResult : CustomRollResult {
    return roll({
      ...this.toOptions,
      quantity,
      modifiers
    } as NumericRollOptions) as T extends number
      ? NumericRollResult
      : CustomRollResult
  }

  /**
   * Converts the die to roll options format
   *
   * This getter returns an options object that can be used with the roll() function.
   * It's useful for creating complex rolls or when you need to manipulate the
   * options before rolling.
   *
   * @returns Roll options object for this die
   *
   * @example
   * // Get options for a d20
   * const d20 = new D(20);
   * const options = d20.toOptions;
   * // Result: { quantity: 1, sides: 20 }
   *
   * @example
   * // Use options with roll function
   * import { roll } from '@randsum/dice';
   * const d6 = new D(6);
   * const options = { ...d6.toOptions, quantity: 3, modifiers: { plus: 2 } };
   * const result = roll(options); // Roll 3d6+2
   */
  public get toOptions(): T extends number
    ? NumericRollOptions
    : CustomRollOptions {
    if (this.type === 'numerical') {
      return {
        quantity: 1,
        sides: this.sides
      } as T extends number ? NumericRollOptions : CustomRollOptions
    }
    return {
      quantity: 1,
      sides: [...this.faces] as string[]
    } as T extends number ? NumericRollOptions : CustomRollOptions
  }
}

/**
 * A four-sided die (tetrahedron)
 * Commonly used in tabletop RPGs for small damage values
 */
export const D4: BaseD<number> = new D(4)

/**
 * A six-sided die (cube)
 * The most common die type, used in many games
 */
export const D6: BaseD<number> = new D(6)

/**
 * An eight-sided die (octahedron)
 * Often used for medium weapon damage in tabletop RPGs
 */
export const D8: BaseD<number> = new D(8)

/**
 * A ten-sided die (pentagonal trapezohedron)
 * Used in many RPGs and for percentile rolls when paired with another D10
 */
export const D10: BaseD<number> = new D(10)

/**
 * A twelve-sided die (dodecahedron)
 * Used in many RPGs for larger weapons and special abilities
 */
export const D12: BaseD<number> = new D(12)

/**
 * A twenty-sided die (icosahedron)
 * The iconic die for Dungeons & Dragons and many other RPGs
 * Used for attack rolls, saving throws, and skill checks
 */
export const D20: BaseD<number> = new D(20)

/**
 * A percentile die (simulated with two D10s)
 * Used for percentage checks and random tables
 * Generates a number between 1-100
 */
export const D100: BaseD<number> = new D(100)

/**
 * A two-sided coin with "Heads" and "Tails" faces
 * Used for binary decisions or simple 50/50 probability
 */
export const coin: BaseD<string[]> = new D(['Heads', 'Tails'])

/**
 * Fudge/Fate dice with plus, minus, and blank faces
 * Used in Fate RPG system and its derivatives
 * Has 3 '+' faces, 2 blank faces, and 1 '-' face
 */
export const fudgeDice: BaseD<string[]> = new D(['+', '+', '+', '-', ' ', ' '])

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
export const alphaNumDie: BaseD<string[]> = new D(alphanumFaces)
