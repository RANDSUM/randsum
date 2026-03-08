import { ModifierError } from '../../errors'
import type { ComparisonOptions } from '../../types'

/**
 * Validates that a ComparisonOptions object is not self-contradictory.
 * Throws ModifierError if the condition can never be satisfied by any integer.
 */
export function validateComparisonOptions(modifierName: string, options: ComparisonOptions): void {
  const { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual } = options

  const lower = computeLower(greaterThanOrEqual, greaterThan)
  const upper = computeUpper(lessThanOrEqual, lessThan)

  if (lower !== undefined && upper !== undefined && lower > upper) {
    throw new ModifierError(
      modifierName,
      `Impossible comparison: condition requires value >= ${lower} AND <= ${upper}`
    )
  }
}

function computeLower(gte: number | undefined, gt: number | undefined): number | undefined {
  if (gte !== undefined) return gte
  if (gt !== undefined) return gt + 1
  return undefined
}

function computeUpper(lte: number | undefined, lt: number | undefined): number | undefined {
  if (lte !== undefined) return lte
  if (lt !== undefined) return lt - 1
  return undefined
}
