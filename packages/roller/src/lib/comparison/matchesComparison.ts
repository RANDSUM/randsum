import type { ComparisonOptions } from '../../types/modifiers'

export function matchesComparison(
  value: number,
  { greaterThan, lessThan, exact }: ComparisonOptions & { exact?: number[] }
): boolean {
  if (exact?.includes(value)) return true
  if (greaterThan !== undefined && value > greaterThan) return true
  if (lessThan !== undefined && value < lessThan) return true

  return false
}
