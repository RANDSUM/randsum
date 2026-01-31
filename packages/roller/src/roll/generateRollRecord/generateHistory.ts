import type { RandomFn } from '../../lib/random'
import { coreRandom } from '../../lib/random'
import { MODIFIER_ORDER } from '../../lib/modifiers/constants'
import type { NumericRollBonus, RollParams, RollRecord } from '../../types'
import { applyModifiers } from '../../lib/modifiers'

export function generateHistory<T>(
  { sides, quantity = 1, modifiers = {} }: RollParams<T>,
  rolls: RollRecord<T>['modifierHistory']['initialRolls'],
  rng?: RandomFn
): RollRecord<T>['modifierHistory'] {
  const hasModifiers = MODIFIER_ORDER.some(key => modifiers[key] !== undefined)

  if (!hasModifiers) {
    return {
      total: rolls.reduce((acc, cur) => acc + cur, 0),
      initialRolls: rolls,
      modifiedRolls: rolls,
      logs: []
    }
  }

  const rollOne = (): number => coreRandom(sides, rng)

  const rollParams = { sides, quantity }

  const bonuses: NumericRollBonus = {
    simpleMathModifier: 0,
    rolls,
    logs: []
  }

  for (const modifierKey of MODIFIER_ORDER) {
    if (modifiers[modifierKey]) {
      const result = applyModifiers(
        modifierKey,
        modifiers[modifierKey],
        bonuses,
        rollParams,
        rollOne
      )

      bonuses.rolls = result.rolls
      bonuses.simpleMathModifier = result.simpleMathModifier
      bonuses.logs = result.logs
    }
  }

  // Check if success counting is enabled
  const successCountOptions = modifiers.countSuccesses
  let total: number

  if (successCountOptions) {
    // Count successes instead of summing
    const successes = bonuses.rolls.filter(roll => roll >= successCountOptions.threshold).length
    const botchThreshold = successCountOptions.botchThreshold
    const botches =
      botchThreshold !== undefined ? bonuses.rolls.filter(roll => roll <= botchThreshold).length : 0
    // For now, just return success count (could subtract botches in the future)
    total = successes - botches
  } else {
    // Normal sum calculation with multipliers
    // Order: (dice sum × multiply) ± plus/minus) × multiplyTotal
    const diceSum = bonuses.rolls.reduce((acc, cur) => acc + cur, 0)

    // Apply pre-arithmetic multiply (*N)
    const multipliedSum = modifiers.multiply !== undefined ? diceSum * modifiers.multiply : diceSum

    // Apply arithmetic modifiers (+/-)
    const afterArithmetic = multipliedSum + bonuses.simpleMathModifier

    // Apply total multiply (**N)
    total =
      modifiers.multiplyTotal !== undefined
        ? afterArithmetic * modifiers.multiplyTotal
        : afterArithmetic
  }

  return {
    modifiedRolls: bonuses.rolls,
    initialRolls: rolls,
    total,
    logs: bonuses.logs
  }
}
