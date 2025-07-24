import type { ComparisonOptions } from '../../types/modifiers'
import { formatHumanList } from './formatHumanList'

export function formatComparisonDescription({
  greaterThan,
  lessThan,
  exact
}: ComparisonOptions & { exact?: number[] }): string[] {
  const descriptions: string[] = []

  if (exact?.length) descriptions.push(formatHumanList(exact))
  if (greaterThan !== undefined) descriptions.push(`greater than [${greaterThan}]`)
  if (lessThan !== undefined) descriptions.push(`less than [${lessThan}]`)

  return descriptions
}
