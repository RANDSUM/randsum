/**
 * Shared utilities for explosion-type modifiers (explode, compound, penetrate).
 *
 * These modifiers share a common pattern:
 * - Trigger on maximum die value (or a condition expression)
 * - Recursively roll additional dice
 * - Have configurable depth limits
 */

import { DEFAULT_EXPLOSION_DEPTH } from '../../lib/constants'
import type { ComparisonOptions } from '../../notation/types'
import type { ModifierApplyResult, ModifierContext } from '../schema'
import { assertRequiredContext } from '../schema'
import { buildExplosionTrigger } from './conditionMatch'

/**
 * Strategy for handling explosion results.
 */
export interface ExplosionStrategy {
  /**
   * How to incorporate the new roll into the result.
   *
   * @param currentValue - The current accumulated value for this die
   * @param newRoll - The new roll result
   * @param depth - Current recursion depth
   * @returns The new accumulated value
   */
  accumulate: (currentValue: number, newRoll: number, depth: number) => number

  /**
   * Whether the explosion continues to a new roll.
   * Default behavior: continue if newRoll equals max sides.
   *
   * @param newRoll - The roll that was just made
   * @param sides - Maximum die value
   * @returns true to continue explosion chain
   */
  shouldContinue?: (newRoll: number, sides: number) => boolean
}

/**
 * Pre-defined explosion strategies.
 */
export const ExplosionStrategies: {
  compound: ExplosionStrategy
  penetrate: ExplosionStrategy
} = {
  /**
   * Standard compound: add rolls to the die value.
   * Used by: compound (!!)
   */
  compound: {
    accumulate: (current: number, newRoll: number): number => current + newRoll
  },

  /**
   * Penetrating: add (roll - 1) to the die value, minimum 1.
   * Used by: penetrate (!p)
   */
  penetrate: {
    accumulate: (current: number, newRoll: number): number => current + Math.max(1, newRoll - 1)
  }
}

/**
 * Resolve the max depth from explosion options.
 *
 * Convention:
 *   - `true`              -> use defaultDepth (modifier's built-in default)
 *   - `0`                 -> "unlimited" -- uses DEFAULT_EXPLOSION_DEPTH as a practical ceiling
 *   - N (integer)         -> explode at most N times
 *   - `false`             -> disabled (should not reach here; handled upstream)
 *   - ComparisonOptions   -> use defaultDepth (condition controls trigger, not depth)
 *
 * Note: `0` means "unlimited" by convention (matching dice notation where !!0 = unlimited
 * compound). It does NOT mean "never explode". Use `false` to disable.
 */
export function resolveExplosionDepth(
  options: boolean | number | ComparisonOptions,
  defaultDepth = 1
): number {
  if (typeof options === 'object') return defaultDepth
  if (options === true) return defaultDepth
  if (options === false) return 0 // false means disabled, but shouldn't reach here
  if (options === 0) return DEFAULT_EXPLOSION_DEPTH
  return options
}

/**
 * Apply accumulating explosion to a single die value.
 *
 * This is used for compound and penetrate modifiers where
 * the explosion adds to the existing die rather than creating new dice.
 *
 * @param initial - The initial die value (must trigger to start)
 * @param sides - The die's maximum value
 * @param rollOne - Function to roll a single die
 * @param maxDepth - Maximum recursion depth
 * @param strategy - How to accumulate results
 * @param trigger - Predicate that determines whether a roll triggers continuation
 * @returns The final accumulated value
 */
export function applyAccumulatingExplosion(
  initial: number,
  sides: number,
  rollOne: () => number,
  maxDepth: number,
  strategy: ExplosionStrategy,
  trigger?: (value: number, sides: number) => boolean
): number {
  const shouldContinue = trigger ?? strategy.shouldContinue ?? ((roll, max) => roll === max)

  const recurse = (total: number, depth: number): number => {
    if (depth >= maxDepth) return total

    const newRoll = rollOne()
    const newTotal = strategy.accumulate(total, newRoll, depth)

    if (!shouldContinue(newRoll, sides)) return newTotal
    return recurse(newTotal, depth + 1)
  }

  return recurse(initial, 0)
}

/**
 * Create a ModifierBehavior.apply function for accumulating explosion modifiers
 * (compound and penetrate). Both share the same pattern: map over rolls,
 * apply explosion to any die that hit the trigger condition.
 */
export function createAccumulatingExplosionBehavior(
  strategy: ExplosionStrategy
): (
  rolls: number[],
  options: boolean | number | ComparisonOptions,
  ctx: ModifierContext
) => ModifierApplyResult {
  return (rolls, options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const { sides } = parameters
    const maxDepth = resolveExplosionDepth(options)
    const trigger = buildExplosionTrigger(typeof options === 'number' ? true : options)

    const result = rolls.map(roll =>
      trigger(roll, sides)
        ? applyAccumulatingExplosion(roll, sides, rollOne, maxDepth, strategy, trigger)
        : roll
    )

    return { rolls: result }
  }
}
