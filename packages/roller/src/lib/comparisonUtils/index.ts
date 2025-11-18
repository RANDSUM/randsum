export function matchesComparison(
  value: number,
  condition: { greaterThan?: number; lessThan?: number }
): boolean {
  if (condition.greaterThan !== undefined && value <= condition.greaterThan) {
    return false
  }
  if (condition.lessThan !== undefined && value >= condition.lessThan) {
    return false
  }
  return true
}

export function matchesExact(value: number, exact: number[]): boolean {
  return exact.includes(value)
}

export function matchesReplaceFrom(
  value: number,
  from: number | { greaterThan?: number; lessThan?: number }
): boolean {
  if (typeof from === 'number') {
    return value === from
  }
  return matchesComparison(value, from)
}

