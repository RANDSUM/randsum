import { NotationParseError } from '../errors'
import { parseNotation } from './lexer/parse'
import type { DiceNotation } from './types'
import { suggestNotationFix } from './suggestions'

/**
 * Type guard that checks if a value is valid dice notation.
 *
 * Acceptance is decided by the single cursor parser (`parseNotation`): the string
 * must lex cleanly and satisfy the grammar (begins with a pool, no unknown tokens,
 * positive-integer magnitudes, at most one Count-family modifier). This is the
 * same pass that drives tokenize, validateNotation, notationToOptions and roll —
 * there is no separate strip-and-check regex system anymore.
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
  return parseNotation(argument).valid
}

/**
 * Validates a string as DiceNotation, throwing if invalid.
 *
 * @param input - String to validate
 * @returns The input narrowed to DiceNotation
 * @throws NotationParseError if input is not valid dice notation
 */
export function notation(input: string): DiceNotation {
  const result = typeof input === 'string' ? parseNotation(input) : null
  if (result?.valid) return input as DiceNotation

  const suggestion = suggestNotationFix(input)
  throw new NotationParseError(
    input,
    'String does not match dice notation pattern',
    suggestion,
    result?.error ? { position: result.error.position } : undefined
  )
}
