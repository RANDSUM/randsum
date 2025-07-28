import type { ComparisonOptions } from '../../types'
import { formatHumanList } from './formatHumanList'
import { FORMAT_STRINGS } from '../constants'

export function formatComparison(
  options: ComparisonOptions & { exact?: number[] },
  formatters: {
    exact: (values: number[]) => string
    greaterThan: (value: number) => string
    lessThan: (value: number) => string
  }
): string[] {
  const results: string[] = []
  const { greaterThan, lessThan, exact } = options

  if (exact?.length) results.push(formatters.exact(exact))
  if (greaterThan !== undefined) results.push(formatters.greaterThan(greaterThan))
  if (lessThan !== undefined) results.push(formatters.lessThan(lessThan))

  return results
}

export function formatComparisonDescription(
  options: ComparisonOptions & { exact?: number[] }
): string[] {
  return formatComparison(options, {
    exact: formatHumanList,
    greaterThan: FORMAT_STRINGS.GREATER_THAN,
    lessThan: FORMAT_STRINGS.LESS_THAN
  })
}
