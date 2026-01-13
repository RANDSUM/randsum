import { completeRollPattern, coreNotationPattern } from './lib/patterns'
import type { DiceNotation } from './types'
import { NotationParseError } from './errors'

/**
 * Type guard that checks if a value is valid dice notation.
 *
 * @param argument - Value to check
 * @returns True if argument is valid dice notation, false otherwise
 *
 * @example
 * ```ts
 * if (isDiceNotation("4d6L")) {
 *   // TypeScript knows this is DiceNotation here
 * }
 * ```
 */
export function isDiceNotation(argument: unknown): argument is DiceNotation {
  if (typeof argument !== 'string') return false
  const trimmedArg = argument.trim()
  const basicTest = coreNotationPattern.test(trimmedArg)
  if (!basicTest) return false

  const cleanArg = trimmedArg.replace(/\s/g, '')
  const remaining = cleanArg.replaceAll(completeRollPattern, '')
  return remaining.length === 0
}

/**
 * Creates a branded DiceNotation type from a string.
 * Throws NotationParseError if the string is not valid dice notation.
 *
 * @param input - String to validate and convert to DiceNotation
 * @returns Branded DiceNotation type
 * @throws NotationParseError if input is not valid dice notation
 */
export function notation(input: string): DiceNotation {
  if (!isDiceNotation(input)) {
    throw new NotationParseError(input, 'String does not match dice notation pattern')
  }
  return input
}
