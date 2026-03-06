import type { ComparisonOptions } from '../../types'

export function matchesComparison(
  value: number,
  { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, exact }: ComparisonOptions
): boolean {
  if (exact?.includes(value)) return true
  if (greaterThan !== undefined && value > greaterThan) return true
  if (greaterThanOrEqual !== undefined && value >= greaterThanOrEqual) return true
  if (lessThan !== undefined && value < lessThan) return true
  if (lessThanOrEqual !== undefined && value <= lessThanOrEqual) return true

  return false
}
