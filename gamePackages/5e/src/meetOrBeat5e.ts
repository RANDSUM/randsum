import { roll5e } from './roll5e'
import type { RollArgument5e } from './types'

/**
 * Checks if a 5e roll meets or exceeds a Difficulty Class
 *
 * This function performs a d20 roll using 5e mechanics and compares
 * the result against a target Difficulty Class (DC). It's commonly
 * used for ability checks, saving throws, and attack rolls.
 *
 * @param difficultyClass - The target DC to meet or exceed (typically 5-30)
 * @param rollArg - Roll configuration including modifier and advantage/disadvantage
 *
 * @returns `true` if the roll total meets or exceeds the DC, `false` otherwise
 *
 * @example
 * // Simple ability check against DC 15
 * meetOrBeat5e(15, { modifier: 5 }) // d20 + 5 vs DC 15
 *
 * @example
 * // Saving throw with advantage
 * meetOrBeat5e(12, { modifier: 3, rollingWith: 'Advantage' })
 *
 * @example
 * // Attack roll with disadvantage
 * meetOrBeat5e(18, { modifier: 8, rollingWith: 'Disadvantage' })
 */
export function meetOrBeat5e(
  difficultyClass: number,
  rollArg: RollArgument5e
): boolean {
  return roll5e(rollArg).total >= difficultyClass
}
