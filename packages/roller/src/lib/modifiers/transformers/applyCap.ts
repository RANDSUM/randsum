import type { ComparisonOptions } from '../../../types'

export function applyCap(
  value: number,
  { greaterThan, lessThan }: ComparisonOptions,
  replacementValue?: number
): number {
  let result = value

  if (greaterThan !== undefined && result > greaterThan) {
    result = replacementValue ?? greaterThan
  }

  if (lessThan !== undefined && result < lessThan) {
    result = replacementValue ?? lessThan
  }

  return result
}
