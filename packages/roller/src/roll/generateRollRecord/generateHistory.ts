/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import type {
  ModifierOptions,
  NumericRollBonus,
  RollParams,
  RollRecord
} from '../../types'
import { coreRandom } from '../../lib'
import { calculateTotal } from '../utils/calculateTotal'
import { applyModifier } from './applyModifier'

export function generateHistory(
  { sides, quantity = 1, modifiers = {} }: RollParams,
  rolls: RollRecord['modifierHistory']['initialRolls']
): RollRecord['modifierHistory'] {
  const hasModifiers =
    modifiers.reroll ||
    modifiers.replace ||
    modifiers.cap ||
    modifiers.explode ||
    modifiers.unique ||
    modifiers.drop ||
    modifiers.plus ||
    modifiers.minus

  if (!hasModifiers) {
    return {
      total: calculateTotal(rolls),
      initialRolls: rolls,
      modifiedRolls: rolls.map((n) => Number(n)),
      logs: []
    }
  }

  const rollOne = (): number => coreRandom(sides)

  const rollParams = { sides, quantity, rollOne }

  const bonuses: NumericRollBonus = {
    simpleMathModifier: 0,
    rolls: rolls.map((n) => Number(n)),
    logs: []
  }

  const modifierOrder: (keyof ModifierOptions)[] = [
    'reroll',
    'replace',
    'cap',
    'explode',
    'unique',
    'drop',
    'plus',
    'minus'
  ]

  for (const modifierKey of modifierOrder) {
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
    total: calculateTotal(bonuses.rolls, bonuses.simpleMathModifier),
    logs: bonuses.logs
  }
}
