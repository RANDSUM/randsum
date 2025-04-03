import { D } from './D'
import type { BaseD } from './types'

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
