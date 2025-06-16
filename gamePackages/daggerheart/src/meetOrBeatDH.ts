import { rollDH } from './rollDH'
import type { MeetOrBeatResultDH, RollArgumentDH } from './types'

/**
 * Checks if a Daggerheart roll meets or exceeds a Difficulty Class
 *
 * This function performs a Daggerheart roll using Hope and Fear dice
 * and compares the result against a target Difficulty Class (DC).
 * Critical hope results automatically succeed regardless of the DC.
 *
 * @param difficultyClass - The target DC to meet or exceed (typically 10-20)
 * @param rollArg - Roll configuration including modifier, advantage/disadvantage, and amplification
 *
 * @returns Complete result object with success determination, roll details, and description
 *
 * @example
 * // Basic ability check against DC 12
 * meetOrBeatDH(12, { modifier: 3 })
 * // Returns: { success: boolean, type: 'hope'|'fear'|'critical hope', total: number, ... }
 *
 * @example
 * // Roll with advantage and hope amplification
 * meetOrBeatDH(15, { modifier: 2, rollingWith: 'Advantage', amplifyHope: true })
 *
 * @example
 * // Critical hope always succeeds
 * // If hope and fear dice show same value, success is true regardless of DC
 */
export function meetOrBeatDH(
  difficultyClass: number,
  rollArg: RollArgumentDH
): MeetOrBeatResultDH {
  const result = rollDH(rollArg)
  const core = {
    ...result,
    success:
      result.type === 'critical hope' ? true : result.total >= difficultyClass,
    target: difficultyClass
  }

  return {
    ...core,
    description: formatDescription(core)
  }
}

/**
 * Formats a human-readable description of the roll result
 *
 * @param result - Roll result object without description
 * @returns Formatted description string
 * @internal
 */
function formatDescription({
  type,
  success
}: Omit<MeetOrBeatResultDH, 'description'>): string {
  if (type === 'critical hope') {
    return 'Critical Success (With Hope)'
  }
  if (success) {
    return `Success with ${type}`
  }
  return `Failure with ${type}`
}
