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
    const modifiedRolls = new Array<number>(rolls.length)
    for (let i = 0; i < rolls.length; i++) {
      modifiedRolls[i] = Number(rolls[i])
    }

    return {
      total: calculateTotal(rolls),
      initialRolls: rolls,
      modifiedRolls,
      logs: []
    }
  }

  const rollOne = (): number => coreRandom(sides)

  const rollParams = { sides, quantity, rollOne }

  const initialRollsAsNumbers = new Array<number>(rolls.length)
  for (let i = 0; i < rolls.length; i++) {
    initialRollsAsNumbers[i] = Number(rolls[i])
  }

  const bonuses: NumericRollBonus = {
    simpleMathModifier: 0,
    rolls: initialRollsAsNumbers,
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
