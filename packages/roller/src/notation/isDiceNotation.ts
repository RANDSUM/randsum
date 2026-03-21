import { coreNotationPattern } from './coreNotationPattern'
import type { DiceNotation } from './types'
import { suggestNotationFix } from './suggestions'
import { buildNotationPattern } from './parse/parseModifiers'
import { countPattern } from './definitions/count'

// Special die type patterns (case-insensitive via 'i' flag on final regex)
// Percentile: d% or D% (exact match, no modifiers)
const PERCENTILE_PATTERN = /^[Dd]%$/

// Fate/Fudge: [N]dF[.1|.2] (no modifiers)
const FATE_PATTERN = /^\d*[Dd][Ff](?:\.[12])?$/

// Custom faces: [N]d{faces} (no modifiers)
const CUSTOM_FACES_PATTERN = /^\d*[Dd]\{[^}]+\}$/

// Core patterns for special die types that support modifiers (z, g, DD)
const MODIFIER_DIE_CORES = [
  String.raw`\d*[Zz]\d+`,
  String.raw`\d*[Gg]\d+`,
  String.raw`\d*[Dd][Dd]\d+`
]

// Cache the complete pattern since schemas never change at runtime
// eslint-disable-next-line no-restricted-syntax
let cachedPattern: RegExp | null = null

/**
 * Get the complete notation pattern (core notation + special die cores + all modifier patterns).
 * Caches the RegExp and resets lastIndex before each use.
 */
function getCompleteNotationPattern(): RegExp {
  cachedPattern ??= new RegExp(
    [coreNotationPattern.source, ...MODIFIER_DIE_CORES, buildNotationPattern().source].join('|'),
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
  if (trimmedArg.length === 0 || trimmedArg.length > 1000) return false

  // Check special die types that don't support modifiers (exact match)
  if (PERCENTILE_PATTERN.test(trimmedArg)) return true
  if (FATE_PATTERN.test(trimmedArg)) return true
  if (CUSTOM_FACES_PATTERN.test(trimmedArg)) return true

  // For standard dice, require the core NdS pattern as a quick gate.
  // For special modifier-supporting types (z, g, DD), the complete pattern
  // includes their core patterns alongside the standard NdS pattern.
  const hasStandardCore = coreNotationPattern.test(trimmedArg)
  const hasSpecialCore = MODIFIER_DIE_CORES.some(src => new RegExp(src).test(trimmedArg))
  if (!hasStandardCore && !hasSpecialCore) return false

  const countPatternGlobal = new RegExp(countPattern.source, 'g')
  if ([...trimmedArg.matchAll(countPatternGlobal)].length > 1) return false

  const remaining = trimmedArg.replaceAll(getCompleteNotationPattern(), '')
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
