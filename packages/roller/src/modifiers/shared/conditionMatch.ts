import type { ComparisonOptions } from '../../notation/types'
import { matchesComparison } from '../../lib/comparison/matchesComparison'

/**
 * Build a trigger predicate from explode options.
 *
 * - `true` -> trigger on max value (backward compat)
 * - `ComparisonOptions` -> trigger on condition match
 *
 * Returns a function (value, sides) => boolean.
 */
export function buildExplosionTrigger(
  options: boolean | ComparisonOptions
): (value: number, sides: number) => boolean {
  if (options === true) {
    return (value, sides) => value === sides
  }
  if (options === false) {
    return () => false
  }
  return (value, _sides) => matchesComparison(value, options)
}
