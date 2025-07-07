import type {
  CustomRollParams,
  CustomRollResult,
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

  if (Object.keys(modifiers).length === 0) {
    return {
      total: calculateTotal(rolls),
      initialRolls: rolls,
      modifiedRolls: rolls.map((n) => Number(n)),
      logs: []
    }
  }

  const rollOne = (): number => coreRandom(sides)

  const initialBonuses: NumericRollBonus = {
    simpleMathModifier: 0,
    rolls: rolls.map((n) => Number(n)),
    logs: []
  }

  let bonuses = initialBonuses

  if (modifiers.reroll) {
    bonuses = applyModifier('reroll', modifiers, bonuses, {
      sides,
      quantity,
      rollOne
    })
  }

  if (modifiers.replace) {
    bonuses = applyModifier('replace', modifiers, bonuses, {
      sides,
      quantity,
      rollOne
    })
  }

  if (modifiers.cap) {
    bonuses = applyModifier('cap', modifiers, bonuses, {
      sides,
      quantity,
      rollOne
    })
  }

  if (modifiers.explode) {
    bonuses = applyModifier('explode', modifiers, bonuses, {
      sides,
      quantity,
      rollOne
    })
  }

  if (modifiers.unique) {
    bonuses = applyModifier('unique', modifiers, bonuses, {
      sides,
      quantity,
      rollOne
    })
  }

  if (modifiers.drop) {
    bonuses = applyModifier('drop', modifiers, bonuses, {
      sides,
      quantity,
      rollOne
    })
  }

  if (modifiers.plus) {
    bonuses = applyModifier('plus', modifiers, bonuses, {
      sides,
      quantity,
      rollOne
    })
  }

  if (modifiers.minus) {
    bonuses = applyModifier('minus', modifiers, bonuses, {
      sides,
      quantity,
      rollOne
    })
  }

  return {
    modifiedRolls: bonuses.rolls,
    initialRolls: rolls,
    total: calculateTotal(bonuses.rolls, bonuses.simpleMathModifier),
    logs: bonuses.logs
  }
}
