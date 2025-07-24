import type { DropOptions } from '../../../types'
import { formatHumanList } from '../../comparisonUtils'

export function formatDropDescription({
  highest,
  lowest,
  greaterThan,
  lessThan,
  exact
}: DropOptions): string[] {
  const descriptions: string[] = []

  if (highest) {
    if (highest > 1) {
      descriptions.push(`Drop highest ${highest}`)
    } else {
      descriptions.push('Drop highest')
    }
  }

  if (lowest) {
    if (lowest > 1) {
      descriptions.push(`Drop lowest ${lowest}`)
    } else {
      descriptions.push('Drop lowest')
    }
  }

  if (exact) {
    descriptions.push(`Drop ${formatHumanList(exact)}`)
  }

  if (greaterThan !== undefined) {
    descriptions.push(`Drop greater than [${greaterThan}]`)
  }

  if (lessThan !== undefined) {
    descriptions.push(`Drop less than [${lessThan}]`)
  }

  return descriptions
}
