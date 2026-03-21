import type { ComparisonOptions } from '../../notation/types'

/**
 * Test whether a die value matches a ComparisonOptions condition.
 *
 * Used by the explosion family to support configurable triggers
 * (!{>=8}, !!{=10}, !p{>5}) using the same Condition Expression
 * grammar as Cap, Drop, Reroll, and Count.
 *
 * Multiple conditions are OR'd: a value matches if ANY condition holds.
 */
export function matchesCondition(value: number, condition: ComparisonOptions): boolean {
  if (condition.greaterThanOrEqual !== undefined && value >= condition.greaterThanOrEqual)
    return true
  if (condition.greaterThan !== undefined && value > condition.greaterThan) return true
  if (condition.lessThanOrEqual !== undefined && value <= condition.lessThanOrEqual) return true
  if (condition.lessThan !== undefined && value < condition.lessThan) return true
  if (condition.exact?.includes(value)) return true
  return false
}

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
  return (value, _sides) => matchesCondition(value, options)
}
