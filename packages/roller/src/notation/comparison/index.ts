import type { ComparisonOptions } from '../types'
import { formatHumanList } from '../formatHumanList'

/**
 * Parses a condition string (the `{...}` body of a condition modifier, e.g. for `C{...}`,
 * `R{...}`, `#{...}`) into comparison options.
 *
 * Comma separates conditions, and a die matches when ANY of them holds (RDN 5.2):
 * `{>=7,<3}` matches a die that is 7 or more, or below 3. Bare numbers and `=N`
 * gather in the `exact` list. An operator written twice keeps the bound that
 * matches more, which is what OR means: `{>2,>4}` is `{>2}`.
 *
 * @example
 * parseComparisonNotation('5,10')    // { exact: [5, 10] } — 5 or 10
 * parseComparisonNotation('>=5,<=10') // { greaterThanOrEqual: 5, lessThanOrEqual: 10 } — range
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
      const num = Number(part.slice(2))
      if (!isNaN(num)) result.greaterThanOrEqual = Math.min(num, result.greaterThanOrEqual ?? num)
    } else if (part.startsWith('<=')) {
      const num = Number(part.slice(2))
      if (!isNaN(num)) result.lessThanOrEqual = Math.max(num, result.lessThanOrEqual ?? num)
    } else if (part.startsWith('>')) {
      const num = Number(part.slice(1))
      if (!isNaN(num)) result.greaterThan = Math.min(num, result.greaterThan ?? num)
    } else if (part.startsWith('<')) {
      const num = Number(part.slice(1))
      if (!isNaN(num)) result.lessThan = Math.max(num, result.lessThan ?? num)
    } else if (part.startsWith('=')) {
      const num = Number(part.slice(1))
      if (!isNaN(num)) exact.push(num)
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

export function formatComparisonDescription({
  greaterThan,
  greaterThanOrEqual,
  lessThan,
  lessThanOrEqual,
  exact
}: ComparisonOptions): string[] {
  const descriptions: string[] = []

  if (exact?.length) descriptions.push(formatHumanList(exact))
  if (greaterThanOrEqual !== undefined)
    descriptions.push(`greater than or equal to ${greaterThanOrEqual}`)
  if (greaterThan !== undefined) descriptions.push(`greater than ${greaterThan}`)
  if (lessThanOrEqual !== undefined) descriptions.push(`less than or equal to ${lessThanOrEqual}`)
  if (lessThan !== undefined) descriptions.push(`less than ${lessThan}`)

  return descriptions
}

export function formatComparisonNotation({
  greaterThan,
  greaterThanOrEqual,
  lessThan,
  lessThanOrEqual,
  exact
}: ComparisonOptions): string[] {
  const notations: string[] = []

  if (exact?.length) notations.push(...exact.map(String))
  if (greaterThanOrEqual !== undefined) notations.push(`>=${greaterThanOrEqual}`)
  if (greaterThan !== undefined) notations.push(`>${greaterThan}`)
  if (lessThanOrEqual !== undefined) notations.push(`<=${lessThanOrEqual}`)
  if (lessThan !== undefined) notations.push(`<${lessThan}`)

  return notations
}
