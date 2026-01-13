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

  return {
    modifiedRolls: bonuses.rolls,
    initialRolls: rolls,
    total: bonuses.rolls.reduce((acc, cur) => acc + cur, bonuses.simpleMathModifier),
    logs: bonuses.logs
  }
}
