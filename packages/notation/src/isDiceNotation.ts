import { coreNotationPattern } from './coreNotationPattern'
import type { DiceNotation } from './types'
import { suggestNotationFix } from './suggestions'
import { buildNotationPattern } from './parse/parseModifiers'

// Cache the complete pattern since schemas never change at runtime
// eslint-disable-next-line no-restricted-syntax
let cachedPattern: RegExp | null = null

/**
 * Get the complete notation pattern (core notation + all modifier patterns).
 * Caches the RegExp and resets lastIndex before each use.
 */
function getCompleteNotationPattern(): RegExp {
  cachedPattern ??= new RegExp(
    [coreNotationPattern.source, buildNotationPattern().source].join('|'),
    'g'
  )
  cachedPattern.lastIndex = 0
  return cachedPattern
}

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
  if (trimmedArg.length > 1000) return false
  const basicTest = coreNotationPattern.test(trimmedArg)
  if (!basicTest) return false

  const cleanArg = trimmedArg.replace(/\s/g, '')
  const remaining = cleanArg.replaceAll(getCompleteNotationPattern(), '')
  return remaining.length === 0
}

/**
 * Error thrown when a string is not valid dice notation.
 */
export class NotationParseError extends Error {
  public readonly code = 'INVALID_NOTATION' as const
  public readonly suggestion: string | undefined

  constructor(notation: string, reason: string, suggestion?: string) {
    const message = suggestion
      ? `Invalid notation "${notation}": ${reason}. Did you mean "${suggestion}"?`
      : `Invalid notation "${notation}": ${reason}`
    super(message)
    this.name = 'NotationParseError'
    this.suggestion = suggestion
  }
}

/**
 * Validates a string as DiceNotation, throwing if invalid.
 *
 * @param input - String to validate
 * @returns The input narrowed to DiceNotation
 * @throws NotationParseError if input is not valid dice notation
 */
export function notation(input: string): DiceNotation {
  if (!isDiceNotation(input)) {
    const suggestion = suggestNotationFix(input)
    throw new NotationParseError(input, 'String does not match dice notation pattern', suggestion)
  }
  return input
}
