import { coreNotationPattern, createCompleteRollPattern } from './lib/patterns'
import type { DiceNotation } from './types'
import type { Result } from './lib/utils'
import { error, success } from './lib/utils'
import { NotationParseError } from './errors'
import { suggestNotationFix } from './lib/notation/suggestions'

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
  const remaining = cleanArg.replaceAll(createCompleteRollPattern(), '')
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
    const suggestion = suggestNotationFix(input)
    throw new NotationParseError(input, 'String does not match dice notation pattern', suggestion)
  }
  return input
}

/**
 * Safe version of notation() that returns a Result type instead of throwing.
 *
 * Use this when you want to validate notation without try/catch blocks.
 *
 * @param input - String to validate and convert to DiceNotation
 * @returns Result containing either the DiceNotation or an error
 *
 * @example
 * ```ts
 * const result = tryNotation("4d6L")
 * if (isSuccess(result)) {
 *   // result.data is typed as DiceNotation
 *   roll(result.data)
 * } else {
 *   console.error(result.error.message)
 * }
 * ```
 */
export function tryNotation(input: string): Result<DiceNotation, NotationParseError> {
  if (!isDiceNotation(input)) {
    const suggestion = suggestNotationFix(input)
    return error(
      new NotationParseError(input, 'String does not match dice notation pattern', suggestion)
    )
  }
  return success(input)
}
