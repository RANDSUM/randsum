import type { ComparisonOptions } from '../../types'

export function formatComparisonNotation({
  greaterThan,
  lessThan,
  exact
}: ComparisonOptions & { exact?: number[] }): string[] {
  const notations: string[] = []

  if (exact?.length) notations.push(...exact.map(String))
  if (greaterThan !== undefined) notations.push(`>${greaterThan}`)
  if (lessThan !== undefined) notations.push(`<${lessThan}`)

  return notations
}
