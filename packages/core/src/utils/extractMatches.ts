/**
 * @file Utility function for extracting regex matches from strings
 * @module @randsum/core/utils/extractMatches
 */

/**
 * Extracts all matches of a pattern from a string
 *
 * This utility function simplifies the process of extracting all matches
 * of a regular expression pattern from a string, returning them as an array.
 *
 * @param notationString - The string to extract matches from
 * @param pattern - The regular expression pattern to match
 * @returns Array of matched strings
 *
 * @example
 * // Extract all dice notation modifiers
 * const notation = '2d20H+5';
 * const highestMatches = extractMatches(notation, dropHighestPattern); // ['H']
 * const plusMatches = extractMatches(notation, plusPattern); // ['+5']
 */
export function extractMatches(
  notationString: string,
  pattern: RegExp
): string[] {
  return [...notationString.matchAll(pattern)].map((matches) => matches[0])
}
