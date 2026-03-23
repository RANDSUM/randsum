import type { ModifierOptions } from './types'

/**
 * Notation-only half of a modifier definition.
 *
 * Covers pure string transformation concerns:
 * - Pattern matching
 * - Parsing notation into options
 * - Converting options back to notation
 * - Human-readable description generation
 *
 * @template TOptions - The type of options this modifier's notation represents
 */
export interface NotationSchema<TOptions = unknown> {
  /** Unique identifier matching the key in ModifierOptions */
  name: keyof ModifierOptions

  /**
   * Execution priority (lower = earlier).
   * Shared with ModifierDefinition to determine parse ordering.
   */
  priority: number

  /**
   * Regex pattern to match this modifier in a notation string.
   * Should NOT include 'g' flag - that is handled by the registry.
   */
  pattern: RegExp

  /**
   * Parse notation string into modifier options.
   * Receives the full notation string to allow finding multiple matches.
   * Returns a partial ModifierOptions with just this modifier's key.
   */
  parse: (notation: string) => Partial<ModifierOptions>

  /**
   * Convert options to notation string (e.g., "C{>5}").
   * Returns undefined if options would produce empty notation.
   */
  toNotation: (options: TOptions) => string | undefined

  /**
   * Convert options to human-readable description strings.
   * Returns array of descriptions (some modifiers produce multiple lines).
   */
  toDescription: (options: TOptions) => string[]
}

/**
 * Define a notation schema with type checking.
 * This is a type-safe factory for creating notation schemas.
 *
 * @param schema - Complete notation schema
 * @returns The schema unchanged (identity function for type checking)
 */
export function defineNotationSchema<TOptions>(
  schema: NotationSchema<TOptions>
): NotationSchema<TOptions> {
  return schema
}
