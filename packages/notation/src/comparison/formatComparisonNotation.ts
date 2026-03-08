import type { ComparisonOptions } from '../types'

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
