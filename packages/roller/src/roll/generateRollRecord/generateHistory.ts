import { coreRandom } from '../../lib/random'
import { MODIFIER_ORDER } from '../../lib/modifiers/constants'
import type { NumericRollBonus, RollParams, RollRecord } from '../../types'
import { applyModifiers } from '../../lib/modifiers'

export function generateHistory<T>(
  { sides, quantity = 1, modifiers = {} }: RollParams<T>,
  rolls: RollRecord<T>['modifierHistory']['initialRolls']
): RollRecord<T>['modifierHistory'] {
  const hasModifiers = MODIFIER_ORDER.some(key => modifiers[key] !== undefined)

  if (!hasModifiers) {
    const modifiedRolls = Array.from(rolls, roll => roll)

    return {
      total: rolls.reduce((acc, cur) => acc + cur, 0),
      initialRolls: rolls,
      modifiedRolls,
      logs: []
    }
  }

  const rollOne = (): number => coreRandom(sides)

  const rollParams = { sides, quantity }

  const initialRollsAsNumbers = Array.from(rolls, roll => roll)

  const bonuses: NumericRollBonus = {
    simpleMathModifier: 0,
    rolls: initialRollsAsNumbers,
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
