import type { ComparisonOptions } from '../../types'
import { formatHumanList } from '../utils'

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
    descriptions.push(`greater than or equal to [${greaterThanOrEqual}]`)
  if (greaterThan !== undefined) descriptions.push(`greater than [${greaterThan}]`)
  if (lessThanOrEqual !== undefined) descriptions.push(`less than or equal to [${lessThanOrEqual}]`)
  if (lessThan !== undefined) descriptions.push(`less than [${lessThan}]`)

  return descriptions
}
