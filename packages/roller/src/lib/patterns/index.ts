// Regular expression patterns for parsing dice notation

/**
 * Core dice notation pattern: XdY where X is quantity and Y is sides
 * Case insensitive, matches patterns like "2d6", "1D20", "100d100"
 */
export const coreNotationPattern = /\d+[dD]\d+/

/**
 * Complete roll pattern that matches all components of dice notation:
 * - Core dice with optional leading +/- (e.g., "2d6", "-1d20", "+3d6")
 * - Drop modifiers: L, H with optional count (L, L2, H, H3)
 * - Drop with conditions: D{...}
 * - Reroll: R{...} or R3 (max modifier)
 * - Cap, Replace, Unique: C{...}, V{...}, U{...} or U
 * - Explode: !
 * - Arithmetic: +3, -2
 *
 * This pattern is global and matches individual components
 */
export const completeRollPattern =
  /[+\-]?\d+[dD]\d+|[LlHh]\d*|[Dd]\{\s*(?:[<>]\d+|[\d,\s=<>]+)\s*\}|[Rr](?:\d+|\{\s*(?:[<>]\d+|[\d,\s=<>]+)\s*\}\d*)|[CcVv]\{\s*(?:[<>]\d+|[\d,\s=<>]+)\s*\}|[Uu](?:\{\s*[\d,\s]+\s*\})?|!|[+\-]\d+/g

