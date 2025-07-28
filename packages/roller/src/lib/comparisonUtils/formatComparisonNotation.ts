import type { ComparisonOptions } from '../../types'
import { formatComparison } from './formatComparisonDescription'

export function formatComparisonNotation(
  options: ComparisonOptions & { exact?: number[] }
): string[] {
  return formatComparison(options, {
    exact: values => values.map(String).join(','),
    greaterThan: value => `>${value}`,
    lessThan: value => `<${value}`
  }).flatMap(result => result.split(','))
}
