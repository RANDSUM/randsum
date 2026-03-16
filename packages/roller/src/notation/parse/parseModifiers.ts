import type { ModifierOptions } from '../types'
import { countFailuresSchema } from '../definitions/countFailures'
import { countSuccessesSchema } from '../definitions/countSuccesses'
import { RANDSUM_MODIFIERS } from '../../lib/modifiers/definitions'

/**
 * Minimal schema fields needed for notation parsing.
 * Avoids generic variance issues with NotationSchema<TOptions>.
 */
interface ParseableSchema {
  readonly name: keyof ModifierOptions
  readonly priority: number
  readonly pattern: RegExp
  readonly parse: (notation: string) => Partial<ModifierOptions>
}

/**
 * Count-family sugar schemas that translate S{N} and F{N} notation to count options.
 * These are notation-only and not yet registered in RANDSUM_MODIFIERS (see Story 9).
 */
const COUNT_FAMILY_SUGAR: readonly ParseableSchema[] = [countSuccessesSchema, countFailuresSchema]

/**
 * Pre-process syntactic sugar in notation before schema parsing.
 * - `ms{N}` (margin of success) → `-N` (case-insensitive)
 */
const marginOfSuccessPattern = /[Mm][Ss]\{(\d+)\}/g

function preprocessNotation(notation: string): string {
  return notation.replace(marginOfSuccessPattern, (_match, n: string) => `-${n}`)
}

/**
 * All schemas used for parsing: RANDSUM_MODIFIERS plus count-family sugar.
 * Evaluated once at module load.
 */
const PARSE_SCHEMAS: readonly ParseableSchema[] = [...RANDSUM_MODIFIERS, ...COUNT_FAMILY_SUGAR]

/**
 * Parse notation string into ModifierOptions using all known notation schemas.
 * Uses RANDSUM_MODIFIERS as the single source of truth, supplemented by
 * count-family sugar schemas (S{N}, F{N}) pending Story 9 resolution.
 */
export function parseModifiers(notation: string): ModifierOptions {
  const result: ModifierOptions = {}
  const processed = preprocessNotation(notation)

  for (const schema of PARSE_SCHEMAS) {
    if (schema.pattern.test(processed)) {
      schema.pattern.lastIndex = 0
      Object.assign(result, schema.parse(processed))
    }
  }

  return result
}

/**
 * Build a combined regex pattern from all known notation schemas.
 * Patterns are joined in priority order, plus syntactic sugar patterns.
 */
export function buildNotationPattern(): RegExp {
  const sources = [...PARSE_SCHEMAS]
    .sort((a, b) => a.priority - b.priority)
    .map(s => s.pattern.source)

  // Add syntactic sugar patterns that are pre-processed before schema parsing
  sources.push(marginOfSuccessPattern.source)
  // Repeat operator (xN) — handled in notationToOptions, but needed for isDiceNotation validation
  sources.push('[Xx][1-9]\\d*')
  // Annotation labels [text] — stripped before parsing, needed for isDiceNotation validation
  sources.push('\\[[^\\]]+\\]')

  return new RegExp(sources.join('|'), 'g')
}
