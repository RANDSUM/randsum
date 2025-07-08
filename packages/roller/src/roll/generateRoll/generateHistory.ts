/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import type {
  CustomRollParams,
  CustomRollResult,
  ModifierOptions,
  NumericRollBonus,
  NumericRollOptions,
  NumericRollParams,
  NumericRollResult,
  RollParams,
  RollResult
} from '../../types'
import { coreRandom, isCustomRollParams } from '../../lib'
import { calculateTotal } from '../utils/calculateTotal'
import { applyModifier } from './applyModifier'

export function generateHistory(
  parameters: CustomRollParams,
  rolls: CustomRollResult['history']['initialRolls']
): CustomRollResult['history']
export function generateHistory(
  parameters: NumericRollParams,
  rolls: NumericRollResult['history']['initialRolls']
): NumericRollResult['history']
export function generateHistory(
  parameters: NumericRollParams | CustomRollParams,
  rolls:
    | NumericRollResult['history']['initialRolls']
    | CustomRollResult['history']['initialRolls']
): NumericRollResult['history'] | CustomRollResult['history']
export function generateHistory(
  parameters: RollParams,
  rolls: RollResult['history']['initialRolls']
): RollResult['history'] {
  if (
    isCustomRollParams(parameters) &&
    rolls.every((n) => typeof n === 'string')
  ) {
    return {
      total: calculateTotal(rolls),
      modifiedRolls: rolls,
      initialRolls: rolls,
      logs: []
    }
  }

  if (!rolls.every((n) => typeof n === 'number')) {
    throw new Error('Mixed rolls are not supported yet')
  }

  const {
    sides,
    quantity = 1,
    modifiers = {}
  } = parameters.options as NumericRollOptions

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
