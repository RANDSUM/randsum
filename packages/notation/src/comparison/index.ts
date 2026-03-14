import type { ComparisonOptions } from '../types'
import { formatHumanList } from '../formatHumanList'

/**
 * Parses a condition string into comparison options.
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
