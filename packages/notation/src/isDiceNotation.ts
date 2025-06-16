import { completeRollPattern, coreNotationPattern } from './patterns'
import type { DiceNotation } from './types'

/**
 * Type guard function to check if a value is valid dice notation
 *
 * This function validates whether a given value is a valid dice notation string
 * that can be parsed by the RANDSUM system. It performs both basic pattern
 * matching and comprehensive validation to ensure the notation is complete and valid.
 *
 * @param argument - The value to check for valid dice notation
 *
 * @returns `true` if the argument is valid dice notation, `false` otherwise
 *
 * @example
 * // Valid dice notation
 * isDiceNotation('4d6') // true
 * isDiceNotation('2d20H') // true
 * isDiceNotation('3d8+2') // true
 * isDiceNotation('4d6L!R{<3}') // true
 *
 * @example
 * // Invalid notation
 * isDiceNotation('invalid') // false
 * isDiceNotation(123) // false
 * isDiceNotation('') // false
 * isDiceNotation(null) // false
 */
export function isDiceNotation(argument: unknown): argument is DiceNotation {
  const notAString = typeof argument !== 'string'
  const basicTest = !!coreNotationPattern.test(String(argument))
  if (!basicTest || notAString) return false

  const cleanArg = argument.replace(/\s/g, '')

  return cleanArg.replace(completeRollPattern, '').length === 0
}
