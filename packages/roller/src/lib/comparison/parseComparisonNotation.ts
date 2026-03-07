import type { ComparisonOptions } from '../../types'

/**
 * Backward-compatible alias. ComparisonOptions now includes all fields.
 * @deprecated Use ComparisonOptions directly.
 */
export type ExtendedComparisonOptions = ComparisonOptions

/**
 * Parses a condition string into comparison options.
 *
 * Supports:
 * - Exact values: "1", "2", "6" or "=1", "=2"
 * - Greater than: ">5"
 * - Greater than or equal: ">=5"
 * - Less than: "<3"
 * - Less than or equal: "<=3"
 * - Combinations: "1,2,>=5,<3"
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
 * parseComparisonNotation(">=3")
 * // Returns: { greaterThanOrEqual: 3 }
 *
 * parseComparisonNotation("4")
 * // Returns: { exact: [4] }
 * ```
 */
export function parseComparisonNotation(conditionString: string): ComparisonOptions {
  const content = conditionString.replace(/[{}]/g, '')
  const parts = content
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const result: ComparisonOptions = {}
  const exact: number[] = []

  for (const part of parts) {
    if (part.startsWith('>=')) {
      result.greaterThanOrEqual = Number(part.slice(2))
    } else if (part.startsWith('<=')) {
      result.lessThanOrEqual = Number(part.slice(2))
    } else if (part.startsWith('>')) {
      result.greaterThan = Number(part.slice(1))
    } else if (part.startsWith('<')) {
      result.lessThan = Number(part.slice(1))
    } else if (part.startsWith('=')) {
      exact.push(Number(part.slice(1)))
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
 * Checks if a comparison options object has any conditions defined.
 */
export function hasConditions(options: ComparisonOptions): boolean {
  return (
    options.greaterThan !== undefined ||
    options.greaterThanOrEqual !== undefined ||
    options.lessThan !== undefined ||
    options.lessThanOrEqual !== undefined ||
    (options.exact !== undefined && options.exact.length > 0)
  )
}
