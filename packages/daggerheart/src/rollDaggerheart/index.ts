import { roll as coreRoll } from '@randsum/roller'
import type { DaggerheartRollArgument, DaggerheartRollResult } from '../types'
import { calculateType } from './calculateType'
import { calculateTotal } from './calculateTotal'

/**
 * Roll dice for Daggerheart system (Hope + Fear dice).
 *
 * @param options - Roll configuration options
 * @param options.modifier - Modifier to add to both dice (default: 0)
 * @param options.rollingWith - Roll with advantage or disadvantage
 * @param options.amplifyHope - Use d20 instead of d12 for Hope die (default: false)
 * @param options.amplifyFear - Use d20 instead of d12 for Fear die (default: false)
 * @returns Roll result with type (hope/fear/critical hope), total, and individual rolls
 *
 * @example
 * ```typescript
 * // Basic roll
 * const basic = rollDaggerheart()
 *
 * // Roll with modifier
 * const skilled = rollDaggerheart({ modifier: 3 })
 *
 * // Roll with advantage
 * const advantage = rollDaggerheart({ rollingWith: 'Advantage' })
 *
 * // Amplified roll (d20s instead of d12s)
 * const amplified = rollDaggerheart({
 *   amplifyHope: true,
 *   amplifyFear: true
 * })
 *
 * // Check the result type
 * switch (result.type) {
 *   case 'critical hope': // Hope and Fear dice equal
 *   case 'hope':          // Hope die higher
 *   case 'fear':          // Fear die higher
 * }
 * ```
 */
export function rollDaggerheart({
  modifier = 0,
  rollingWith,
  amplifyHope = false,
  amplifyFear = false
}: DaggerheartRollArgument = {}): DaggerheartRollResult {
  const hopeResult = coreRoll({
    quantity: 1,
    sides: amplifyHope ? 20 : 12,
    modifiers: { plus: modifier }
  })
  const fearResult = coreRoll({
    quantity: 1,
    sides: amplifyFear ? 20 : 12,
    modifiers: { plus: modifier }
  })
  const hope = hopeResult.total
  const fear = fearResult.total
  const total = hope + fear

  const [totalWithAdvantage, advantage] = calculateTotal(total, rollingWith)

  return {
    type: calculateType(hope, fear),
    total: totalWithAdvantage,
    rolls: {
      hope,
      advantage,
      fear,
      modifier
    }
  }
}
