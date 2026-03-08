import type { ModifierOptions } from '../types'
import {
  capSchema,
  compoundSchema,
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
  multiplySchema,
  plusSchema,
  minusSchema,
  multiplyTotalSchema
]

/**
 * Parse notation string into ModifierOptions using all known notation schemas.
 * This is the standalone equivalent of roller's parseModifiersFromRegistry.
 */
export function parseModifiers(notation: string): ModifierOptions {
  const result: ModifierOptions = {}

  for (const schema of allSchemas) {
    if (schema.pattern.test(notation)) {
      schema.pattern.lastIndex = 0
      Object.assign(result, schema.parse(notation))
    }
  }

  return result
}

/**
 * Build a combined regex pattern from all known notation schemas.
 * Patterns are joined in priority order.
 */
export function buildNotationPattern(): RegExp {
  const sources = [...allSchemas].sort((a, b) => a.priority - b.priority).map(s => s.pattern.source)

  return new RegExp(sources.join('|'), 'g')
}
