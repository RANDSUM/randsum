import type { RerollOptions } from '../../../types'
import { formatComparisonDescription } from '../../comparisonUtils'

export function formatRerollDescription({
  exact,
  greaterThan,
  lessThan,
  max
}: RerollOptions): string[] {
  const comparisonOptions: { exact?: number[]; greaterThan?: number; lessThan?: number } = {}
  if (exact !== undefined) comparisonOptions.exact = exact
  if (greaterThan !== undefined) comparisonOptions.greaterThan = greaterThan
  if (lessThan !== undefined) comparisonOptions.lessThan = lessThan

  const conditions = formatComparisonDescription(comparisonOptions)
  if (!conditions.length) return []

  const conditionText = conditions.join(', ')
  const maxText = max !== undefined ? ` (up to ${max} times)` : ''
  return [`Reroll ${conditionText}${maxText}`]
}
