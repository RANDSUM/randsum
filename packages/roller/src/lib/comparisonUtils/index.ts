import type { ComparisonQuery } from '../../types'

/**
 * Check if a value matches a comparison query
 * 
 * @param value - The value to check
 * @param query - The comparison query (lessThan, greaterThan, exact)
 * @returns true if the value matches the query
 */
export function matchesQuery(value: number, query: ComparisonQuery): boolean {
  if (query.exact && query.exact.includes(value)) {
    return true
  }
  
  if (query.lessThan !== undefined && value < query.lessThan) {
    return true
  }
  
  if (query.greaterThan !== undefined && value > query.greaterThan) {
    return true
  }
  
  return false
}

/**
 * Check if a value matches a comparison query (for replace modifier)
 * Supports both number and ComparisonQuery as 'from' value
 * 
 * @param value - The value to check
 * @param from - The value or query to match against
 * @returns true if the value matches
 */
export function matchesReplaceFrom(
  value: number,
  from: number | ComparisonQuery
): boolean {
  if (typeof from === 'number') {
    return value === from
  }
  
  return matchesQuery(value, from)
}

