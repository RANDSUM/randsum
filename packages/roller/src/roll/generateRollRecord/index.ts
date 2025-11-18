import type {
  ModifierHistory,
  NumericRollBonus,
  RollRecord,
  RollParams
} from '../../types'
import { coreRandom, coreSpreadRolls } from '../../lib/random'
import { applyModifiers } from '../../lib/modifiers'

function baseBonus(rolls: number[]): NumericRollBonus {
  return {
    rolls,
    simpleMathModifier: 0,
    logs: []
  }
}

export function generateRollRecord(parameters: RollParams): RollRecord {
  const initialRolls = coreSpreadRolls(parameters.quantity, parameters.sides)
  let bonus = baseBonus(initialRolls)

  const ctx = {
    sides: parameters.sides,
    quantity: parameters.quantity,
    modifiers: parameters.modifiers
  }

  const rollOne = (): number => coreRandom(parameters.sides)

  if (parameters.modifiers) {
    const mods = parameters.modifiers
    if (mods.cap) {
      bonus = applyModifiers('cap', mods.cap, bonus, ctx, rollOne)
    }
    if (mods.drop) {
      bonus = applyModifiers('drop', mods.drop, bonus, ctx, rollOne)
    }
    if (mods.replace) {
      bonus = applyModifiers('replace', mods.replace, bonus, ctx, rollOne)
    }
    if (mods.explode) {
      bonus = applyModifiers('explode', mods.explode, bonus, ctx, rollOne)
    }
    if (mods.unique !== undefined) {
      bonus = applyModifiers('unique', mods.unique, bonus, ctx, rollOne)
    }
    if (mods.reroll) {
      bonus = applyModifiers('reroll', mods.reroll, bonus, ctx, rollOne)
    }
    if (mods.plus !== undefined) {
      bonus = applyModifiers('plus', mods.plus, bonus, ctx, rollOne)
    }
    if (mods.minus !== undefined) {
      bonus = applyModifiers('minus', mods.minus, bonus, ctx, rollOne)
    }
  }

  const rollTotal = bonus.rolls.reduce((sum, v) => sum + v, 0)
  const total = rollTotal + bonus.simpleMathModifier

  const modifierHistory: ModifierHistory = {
    initialRolls,
    modifiedRolls: bonus.rolls,
    total,
    logs: bonus.logs
  }

  return {
    parameters,
    modifierHistory,
    total
  }
}


