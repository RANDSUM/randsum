import type { ModifierOptions } from '../types'
import {
  capSchema,
  compoundSchema,
  countFailuresSchema,
  countSuccessesSchema,
  dropSchema,
  explodeSchema,
  keepSchema,
  minusSchema,
  multiplySchema,
  multiplyTotalSchema,
  penetrateSchema,
  plusSchema,
  replaceSchema,
  rerollSchema,
  sortSchema,
  uniqueSchema
} from '../definitions'

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

const allSchemas: readonly ParseableSchema[] = [
  capSchema,
  dropSchema,
  keepSchema,
  replaceSchema,
  rerollSchema,
  explodeSchema,
  compoundSchema,
  penetrateSchema,
  uniqueSchema,
  countSuccessesSchema,
  countFailuresSchema,
  multiplySchema,
  plusSchema,
  minusSchema,
  sortSchema,
  multiplyTotalSchema
]

/**
 * Pre-process syntactic sugar in notation before schema parsing.
 * - `ms{N}` (margin of success) → `-N` (case-insensitive)
 */
const marginOfSuccessPattern = /[Mm][Ss]\{(\d+)\}/g

function preprocessNotation(notation: string): string {
  return notation.replace(marginOfSuccessPattern, (_match, n: string) => `-${n}`)
}

/**
 * Parse notation string into ModifierOptions using all known notation schemas.
 * This is the standalone equivalent of roller's parseModifiers.
 */
export function parseModifiers(notation: string): ModifierOptions {
  const result: ModifierOptions = {}
  const processed = preprocessNotation(notation)

  for (const schema of allSchemas) {
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
  const sources = [...allSchemas].sort((a, b) => a.priority - b.priority).map(s => s.pattern.source)

  // Add syntactic sugar patterns that are pre-processed before schema parsing
  sources.push(marginOfSuccessPattern.source)

  return new RegExp(sources.join('|'), 'g')
}
