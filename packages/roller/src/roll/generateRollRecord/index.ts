import type { NumericRollBonus, RollParams, RollRecord } from '../../types'
import { coreSpreadRolls } from '../../lib/random'
import { applyModifiers } from '../../lib/modifiers/applyModifiers'

export function generateRollRecord(params: RollParams): RollRecord {
  const sides = typeof params.sides === 'number' ? params.sides : params.sides.length
  const quantity = params.quantity ?? 1

  // Generate initial rolls
  let rolls: number[]
  if (typeof params.sides === 'number') {
    rolls = coreSpreadRolls(quantity, sides)
  } else {
    // Custom faces
    rolls = coreSpreadRolls(quantity, params.sides.length)
  }

  // Create initial bonus
  let bonus: NumericRollBonus = {
    rolls: [...rolls],
    simpleMathModifier: 0,
    logs: [],
    modifiedRolls: [...rolls],
    initialRolls: [...rolls]
  }

  // Create rollOne function for modifiers that need it
  const rollOne = (): number => {
    if (typeof params.sides === 'number') {
      return coreSpreadRolls(1, params.sides)[0]
    } else {
      return coreSpreadRolls(1, params.sides.length)[0]
    }
  }

  const context = {
    sides,
    quantity
  }

  // Apply modifiers in order
  if (params.modifiers) {
    // Apply cap first
    if (params.modifiers.cap) {
      bonus = applyModifiers('cap', params.modifiers.cap, bonus, context, rollOne)
    }

    // Apply drop
    if (params.modifiers.drop) {
      bonus = applyModifiers('drop', params.modifiers.drop, bonus, context, rollOne)
    }

    // Apply replace
    if (params.modifiers.replace) {
      bonus = applyModifiers('replace', params.modifiers.replace, bonus, context, rollOne)
    }

    // Apply reroll
    if (params.modifiers.reroll) {
      bonus = applyModifiers('reroll', params.modifiers.reroll, bonus, context, rollOne)
    }

    // Apply explode
    if (params.modifiers.explode) {
      bonus = applyModifiers('explode', params.modifiers.explode, bonus, context, rollOne)
    }

    // Apply unique
    if (params.modifiers.unique) {
      bonus = applyModifiers('unique', params.modifiers.unique, bonus, context, rollOne)
    }

    // Apply arithmetic modifiers
    if (params.modifiers.plus !== undefined) {
      bonus = applyModifiers('plus', params.modifiers.plus, bonus, context, rollOne)
    }
    if (params.modifiers.minus !== undefined) {
      bonus = applyModifiers('minus', params.modifiers.minus, bonus, context, rollOne)
    }
  }

  // Calculate total
  const modifiedRolls = bonus.modifiedRolls || bonus.rolls
  const sum = modifiedRolls.reduce((acc, val) => acc + val, 0)
  const total = sum + bonus.simpleMathModifier

  bonus.total = total

  // Build result array (for custom faces)
  let result: (number | string)[] | undefined
  if (params.faces && params.faces.length > 0) {
    result = modifiedRolls.map(roll => params.faces![roll - 1] ?? roll)
  }

  return {
    parameters: params,
    total,
    modifierHistory: bonus,
    result
  }
}

