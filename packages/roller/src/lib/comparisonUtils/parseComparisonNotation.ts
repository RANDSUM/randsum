import type { ComparisonOptions } from '../../types'
import { REGEX_PATTERNS } from '../constants'

export function parseComparisonNotation(
  bracedString: string
): ComparisonOptions & { exact?: number[] } {
  const content = bracedString.replace(REGEX_PATTERNS.BRACE_CLEANUP, '')
  const parts = content
    .split(',')
    .map(s => s.trim())
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
