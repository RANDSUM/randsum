import { NotationParseError } from '../errors'
import {
  DIE_MARKER_CUSTOM_FACES,
  DIE_MARKER_DRAW,
  DIE_MARKER_FATE,
  DIE_MARKER_GEOMETRIC,
  DIE_MARKER_PERCENTILE,
  DIE_MARKER_ZERO_BIAS
} from './constants'
import { coreNotationPattern } from './coreNotationPattern'
import type { DiceNotation } from './types'
import { suggestNotationFix } from './suggestions'
import { buildNotationPattern, findCountFamilyMatchIndices } from './parse/parseModifiers'

// Special die-type patterns, composed from the canonical marker fragments in constants.ts.
// Each here is a whole-string match: optional quantity prefix + die-type marker (no modifiers).
const PERCENTILE_PATTERN = new RegExp(`^\\d*${DIE_MARKER_PERCENTILE}$`)
const FATE_PATTERN = new RegExp(`^\\d*${DIE_MARKER_FATE}$`)
const CUSTOM_FACES_PATTERN = new RegExp(`^\\d*${DIE_MARKER_CUSTOM_FACES}$`)

// Core patterns for special die types that support modifiers (z, g, DD)
const MODIFIER_DIE_CORES = [
  String.raw`\d*` + DIE_MARKER_ZERO_BIAS,
  String.raw`\d*` + DIE_MARKER_GEOMETRIC,
  String.raw`\d*` + DIE_MARKER_DRAW
]

// Multi-pool stripping patterns for isDiceNotation validation.
// Signed patterns use [+-] (required) to avoid colliding with modifiers like D{>=5}; unsigned
// (leadingSpecial below) only match at the very start of the string.
const SIGNED_POOL_PATTERNS = [
  DIE_MARKER_PERCENTILE,
  DIE_MARKER_CUSTOM_FACES,
  DIE_MARKER_DRAW,
  DIE_MARKER_FATE,
  DIE_MARKER_GEOMETRIC,
  DIE_MARKER_ZERO_BIAS
].map(marker => String.raw`[+-]\d*` + marker)

// Cache the complete pattern since schemas never change at runtime
// biome-ignore lint/plugin: module-level RegExp cache; reassigned via ??= on first access
let cachedPattern: RegExp | null = null // Reset by clearing this if patterns change

/**
 * Get the complete notation pattern (core notation + special die cores + all modifier patterns).
 * Caches the RegExp and resets lastIndex before each use.
 */
function getCompleteNotationPattern(): RegExp {
  cachedPattern ??= new RegExp(
    [
      coreNotationPattern.source,
      ...MODIFIER_DIE_CORES,
      ...SIGNED_POOL_PATTERNS,
      buildNotationPattern().source
    ].join('|'),
    'gi'
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
  // For multi-pool strings, percentile (d%) also counts as a valid core.
  const hasStandardCore = coreNotationPattern.test(trimmedArg)
  const hasSpecialCore = MODIFIER_DIE_CORES.some(src => new RegExp(src).test(trimmedArg))
  const hasAnySpecialDie = new RegExp(
    [DIE_MARKER_PERCENTILE, DIE_MARKER_FATE, DIE_MARKER_CUSTOM_FACES, DIE_MARKER_ZERO_BIAS]
      .map(marker => String.raw`\d*` + marker)
      .join('|')
  ).test(trimmedArg)
  if (!hasStandardCore && !hasSpecialCore && !hasAnySpecialDie) return false

  // Reject multiple count-family modifiers (#{}, S{}, F{}) — they all map to the
  // single `count` option and cannot coexist (see parseModifiers / conformance vector 47).
  if (findCountFamilyMatchIndices(trimmedArg).length > 1) return false

  // Strip the leading special die if the string starts with one (first pool, no sign).
  // This handles cases like "2dF+1d6" where "2dF" is at position 0.
  const leadingSpecial = new RegExp(
    [
      DIE_MARKER_PERCENTILE,
      DIE_MARKER_DRAW,
      DIE_MARKER_FATE,
      DIE_MARKER_CUSTOM_FACES,
      DIE_MARKER_GEOMETRIC,
      DIE_MARKER_ZERO_BIAS
    ]
      .map(marker => String.raw`^\d*` + marker)
      .join('|')
  )
  const stripped = trimmedArg.replace(leadingSpecial, '')

  // Then strip all remaining known tokens (core dice, modifiers, signed pools)
  const remaining = stripped.replaceAll(getCompleteNotationPattern(), '')
  return remaining.length === 0
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
