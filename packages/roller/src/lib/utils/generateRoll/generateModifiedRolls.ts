import { isCustomRollParams } from '../../guards/isCustomRollParams'
import type {
  NumericRollBonus,
  NumericRollOptions,
  RollParams,
  RollPoolResult
} from '../../../types'
import { calculateTotal } from '../calculateTotal'
import { coreRandom } from '../coreRandom'
import { applyModifier } from './applyModifier'

export function generateModifiedRolls(
  parameters: RollParams,
  rolls: RollPoolResult['rawRolls']
): RollPoolResult['modifiedRolls'] {
  if (
    isCustomRollParams(parameters) &&
    rolls.every((n) => typeof n === 'string')
  ) {
    return {
      total: calculateTotal(rolls) as string,
      rolls,
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
      total: calculateTotal(rolls) as number,
      rolls: rolls.map((n) => Number(n)),
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
    rolls: bonuses.rolls,
    total: calculateTotal(bonuses.rolls, bonuses.simpleMathModifier) as number,
    logs: bonuses.logs
  }
}
