import type { ComparisonOptions } from '../../types/modifiers'

/**
 * Checks if a value matches the given comparison criteria
 */
export function matchesComparison(
  value: number,
  options: ComparisonOptions & { exact?: number[] }
): boolean {
  const { greaterThan, lessThan, exact } = options

  // Check exact matches first
  if (exact?.includes(value)) {
    return true
  }

  // Check range conditions
  if (greaterThan !== undefined && value > greaterThan) {
    return true
  }

  if (lessThan !== undefined && value < lessThan) {
    return true
  }

  return false
}

/**
 * Applies comparison-based capping to a value
 */
export function applyCap(
  value: number,
  options: ComparisonOptions,
  replacementValue?: number
): number {
  const { greaterThan, lessThan } = options

  let result = value

  // Apply upper bound
  if (greaterThan !== undefined && result > greaterThan) {
    result = replacementValue ?? greaterThan
  }

  // Apply lower bound
  if (lessThan !== undefined && result < lessThan) {
    result = replacementValue ?? lessThan
  }

  return result
}

/**
 * Formats comparison options for human-readable descriptions
 */
export function formatComparisonDescription(
  options: ComparisonOptions & { exact?: number[] }
): string[] {
  const descriptions: string[] = []

  if (options.exact && options.exact.length > 0) {
    descriptions.push(formatHumanList(options.exact))
  }

  if (options.greaterThan !== undefined) {
    descriptions.push(`greater than [${options.greaterThan}]`)
  }

  if (options.lessThan !== undefined) {
    descriptions.push(`less than [${options.lessThan}]`)
  }

  return descriptions
}

/**
 * Formats comparison options for notation strings
 */
export function formatComparisonNotation(
  options: ComparisonOptions & { exact?: number[] }
): string[] {
  const notations: string[] = []

  if (options.exact && options.exact.length > 0) {
    notations.push(...options.exact.map(String))
  }

  if (options.greaterThan !== undefined) {
    notations.push(`>${options.greaterThan}`)
  }

  if (options.lessThan !== undefined) {
    notations.push(`<${options.lessThan}`)
  }

  return notations
}

/**
 * Formats an array of numbers as a human-readable list
 */
export function formatHumanList(values: number[]): string {
  if (values.length === 0) return ''
  if (values.length === 1) return `[${values[0]}]`

  const formattedItems = values.map((item) => `[${item}]`)
  const lastItem = formattedItems.pop()

  return `${formattedItems.join(' ')} and ${lastItem}`
}

/**
 * Parses comparison notation from a braced string like "{>5,<10,1,2}"
 */
export function parseComparisonNotation(
  bracedString: string
): ComparisonOptions & { exact?: number[] } {
  const content = bracedString.replace(/[{}]/g, '')
  const parts = content
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const result: ComparisonOptions & { exact?: number[] } = {}
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
