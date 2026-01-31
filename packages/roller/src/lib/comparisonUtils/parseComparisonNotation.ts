import type { ComparisonOptions } from '../../types'

/**
 * Extended comparison options that includes exact value matching.
 * Used by modifiers that support both comparison operators and exact values.
 */
export interface ExtendedComparisonOptions extends ComparisonOptions {
  exact?: number[]
}

/**
 * Parses a condition string into comparison options.
 *
 * Supports:
 * - Exact values: "1", "2", "6"
 * - Greater than: ">5"
 * - Less than: "<3"
 * - Combinations: "1,2,>5,<3"
 *
 * Accepts both braced "{1,2,>5}" and unbraced "1,2,>5" strings.
 *
 * @param conditionString - The condition string to parse (with or without braces)
 * @returns Parsed comparison options
 *
 * @example
 * ```ts
 * parseComparisonNotation("{1,2,>5}")
 * // Returns: { exact: [1, 2], greaterThan: 5 }
 *
 * parseComparisonNotation("<3")
 * // Returns: { lessThan: 3 }
 * ```
 */
export function parseComparisonNotation(conditionString: string): ExtendedComparisonOptions {
  // Strip braces if present
  const content = conditionString.replace(/[{}]/g, '')
  const parts = content
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const result: ExtendedComparisonOptions = {}
  const exact: number[] = []

  for (const part of parts) {
    if (part.startsWith('>')) {
      result.greaterThan = Number(part.slice(1))
    } else if (part.startsWith('<')) {
      result.lessThan = Number(part.slice(1))
    } else {
      const num = Number(part)
      if (!isNaN(num)) {
        exact.push(num)
      }
    }
  }

  if (exact.length > 0) {
    result.exact = exact
  }

  return result
}

/**
 * Checks if an extended comparison has any conditions defined.
 */
export function hasConditions(options: ExtendedComparisonOptions): boolean {
  return (
    options.greaterThan !== undefined ||
    options.lessThan !== undefined ||
    (options.exact !== undefined && options.exact.length > 0)
  )
}
