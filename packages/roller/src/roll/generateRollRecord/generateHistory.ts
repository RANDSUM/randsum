import { coreRandom } from '../../lib/random'
import { MODIFIER_ORDER } from '../../lib/modifiers/ModifierEngine'
import type { NumericRollBonus } from '../../types/modifiers'
import type { RollParams, RollRecord } from '../../types/roll'
import { applyModifier } from './applyModifier'

export function generateHistory<T>(
  { sides, quantity = 1, modifiers = {} }: RollParams<T>,
  rolls: RollRecord<T>['modifierHistory']['initialRolls']
): RollRecord<T>['modifierHistory'] {
  const hasModifiers = MODIFIER_ORDER.some(key => modifiers[key] !== undefined)

  if (!hasModifiers) {
    const modifiedRolls = Array.from(rolls, roll => Number(roll))

    return {
      total: rolls.reduce((acc, cur) => Number(acc) + cur, 0),
      initialRolls: rolls,
      modifiedRolls,
      logs: []
    }
  }

  const rollOne = (): number => coreRandom(sides)

  const rollParams = { sides, quantity, rollOne }

  const initialRollsAsNumbers = Array.from(rolls, roll => Number(roll))

  const bonuses: NumericRollBonus = {
    simpleMathModifier: 0,
    rolls: initialRollsAsNumbers,
    logs: []
  }

  for (const modifierKey of MODIFIER_ORDER) {
    if (modifiers[modifierKey]) {
      const result = applyModifier(modifierKey, modifiers, bonuses, rollParams)
      bonuses.rolls = result.rolls
      bonuses.simpleMathModifier = result.simpleMathModifier
      bonuses.logs = result.logs
    }
  }

  return {
    modifiedRolls: bonuses.rolls,
    initialRolls: rolls,
    total: bonuses.rolls.reduce((acc, cur) => Number(acc) + cur, bonuses.simpleMathModifier),
    logs: bonuses.logs
  }
}
