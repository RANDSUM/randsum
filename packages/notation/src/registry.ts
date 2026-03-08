import type { ModifierOptions } from './types'
import { coreNotationPattern } from './coreNotationPattern'

/**
 * Minimal schema fields needed for notation parsing.
 */
interface ParseableSchema {
  readonly name: keyof ModifierOptions
  readonly priority: number
  readonly pattern: RegExp
  readonly parse: (notation: string) => Partial<ModifierOptions>
}

/**
 * Notation-only registry: stores schemas for parsing without execution logic.
 * Populated by registerNotationSchema() when schemas are imported.
 */
const notationRegistry = new Map<keyof ModifierOptions, ParseableSchema>()

// eslint-disable-next-line no-restricted-syntax
let cachedCombinedPattern: RegExp | null = null

function invalidatePatternCache(): void {
  cachedCombinedPattern = null
}

/**
 * Register a notation schema to the notation registry.
 * Called automatically when schema modules are imported.
 */
export function registerNotationSchema(schema: ParseableSchema): void {
  notationRegistry.set(schema.name, schema)
  invalidatePatternCache()
}

/**
 * Build combined regex pattern from all registered notation schemas.
 * Patterns are joined in priority order.
 */
export function buildCombinedModifierPattern(): RegExp {
  const sources = Array.from(notationRegistry.entries())
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([, schema]) => schema.pattern.source)
  return new RegExp(sources.join('|'), 'g')
}

/**
 * Get the cached combined modifier pattern.
 * Builds the pattern lazily on first call and caches it.
 */
export function getCachedCombinedModifierPattern(): RegExp {
  cachedCombinedPattern ??= buildCombinedModifierPattern()
  return cachedCombinedPattern
}

/**
 * Get a fresh combined notation pattern (core + all modifier patterns).
 * Returns a new RegExp each call to prevent shared lastIndex state.
 */
export function createCompleteNotationPattern(): RegExp {
  const combined = getCachedCombinedModifierPattern()
  const source = [coreNotationPattern.source, combined.source].join('|')
  return new RegExp(source, 'g')
}

/**
 * Parse notation string into ModifierOptions using the notation registry.
 */
export function parseModifiersFromRegistry(notation: string): ModifierOptions {
  const result: ModifierOptions = {}

  for (const schema of notationRegistry.values()) {
    if (schema.pattern.test(notation)) {
      schema.pattern.lastIndex = 0
      Object.assign(result, schema.parse(notation))
    }
  }

  return result
}
