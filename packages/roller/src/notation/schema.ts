import type { NotationDoc } from '../docs/modifierDocs'
import type { ModifierOptions } from './types'

/** The RDN faceted category of a modifier lexeme. */
export type ModifierCategory =
  | 'Core'
  | 'Special' // dice types
  | 'Order'
  | 'Clamp'
  | 'Map'
  | 'Filter'
  | 'Substitute'
  | 'Generate'
  | 'Accumulate'
  | 'Scale'
  | 'Reinterpret'
  | 'Dispatch'

/**
 * Notation-only half of a modifier definition.
 *
 * Covers pure string transformation concerns:
 * - Pattern matching
 * - Parsing notation into options
 * - Converting options back to notation
 * - Human-readable description generation
 *
 * The option-taking members are method signatures on purpose: methods are
 * bivariant in their parameters, so a `NotationSchema<KeepOptions>` is a
 * `NotationSchema` without a cast, and the schema lists hold them directly.
 *
 * @template TOptions - The type of options this modifier's notation represents
 */
export interface NotationSchema<TOptions = unknown> {
  /** Unique identifier matching the key in ModifierOptions */
  name: keyof ModifierOptions

  /**
   * Execution priority (lower = earlier). MODIFIER_SCHEMAS is sorted by it, and
   * every ordered modifier list (lexer specs, rendering, RANDSUM_MODIFIERS)
   * derives from that one list.
   */
  priority: number

  /** Stable key of the lexer lexeme this schema matches (e.g. `'C{..}'`, `'drop'`). */
  lexemeKey: string

  /** RDN faceted category of the lexeme. */
  category: ModifierCategory

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
  parse(notation: string): Partial<ModifierOptions>

  /**
   * Convert options to notation string (e.g., "C{>5}").
   * Returns undefined if options would produce empty notation.
   */
  toNotation(options: TOptions): string | undefined

  /**
   * Convert options to human-readable description strings.
   * Returns array of descriptions (some modifiers produce multiple lines).
   */
  toDescription(options: TOptions): string[]

  /**
   * Static documentation entries for this modifier.
   * One modifier may produce multiple entries (e.g., drop produces 'L', 'H', 'D{..}').
   * Required for any modifier registered in RANDSUM_MODIFIERS.
   * Must not reference any behavior-only symbols (safe for tokenize bundle).
   */
  docs?: readonly NotationDoc[]
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
