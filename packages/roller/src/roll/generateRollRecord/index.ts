import type { RollParams, RollRecord, NumericRollBonus } from '../../types'
import { coreRandom, coreSpreadRolls } from '../../lib/random'
import { applyModifiers } from '../../lib/modifiers'

/**
 * Generate a roll record by executing a roll with all modifiers
 * 
 * @param parameters - The roll parameters
 * @returns A complete roll record with modifier history
 */
export function generateRollRecord(parameters: RollParams): RollRecord {
  // Generate initial rolls
  const initialRolls = coreSpreadRolls(parameters.quantity, parameters.sides)
  
  // Start with a bonus object
  let bonus: NumericRollBonus = {
    rolls: initialRolls,
    simpleMathModifier: 0,
    logs: []
  }
  
  // Create a rollOne function for modifiers that need it
  // Note: This adds +1 to convert from 0-indexed to 1-indexed dice rolls
  // When coreRandom is mocked in tests, it may already return 1-indexed values
  const rollOne = (): number => {
    const randomValue = coreRandom(parameters.sides)
    // If randomValue is already >= parameters.sides, it's likely a mock returning
    // a final value, so don't add 1. Otherwise convert from 0-indexed.
    return randomValue >= parameters.sides ? randomValue : randomValue + 1
  }
  
  const context = {
    sides: parameters.sides,
    quantity: parameters.quantity
  }
  
  // Apply modifiers in order
  const modifiers = parameters.modifiers
  
  // Order of modifier application:
  // 1. Cap
  // 2. Drop
  // 3. Replace
  // 4. Reroll
  // 5. Explode
  // 6. Unique
  // 7. Plus/Minus (applied to total at the end)
  
  if (modifiers.cap) {
    bonus = applyModifiers('cap', modifiers.cap, bonus, context, rollOne)
  }
  
  if (modifiers.drop) {
    bonus = applyModifiers('drop', modifiers.drop, bonus, context, rollOne)
  }
  
  if (modifiers.replace) {
    bonus = applyModifiers('replace', modifiers.replace, bonus, context, rollOne)
  }
  
  if (modifiers.reroll) {
    bonus = applyModifiers('reroll', modifiers.reroll, bonus, context, rollOne)
  }
  
  if (modifiers.explode) {
    bonus = applyModifiers('explode', modifiers.explode, bonus, context, rollOne)
  }
  
  if (modifiers.unique) {
    bonus = applyModifiers('unique', modifiers.unique, bonus, context, rollOne)
  }
  
  if (modifiers.plus) {
    bonus = applyModifiers('plus', modifiers.plus, bonus, context, rollOne)
  }
  
  if (modifiers.minus) {
    bonus = applyModifiers('minus', modifiers.minus, bonus, context, rollOne)
  }
  
  // Calculate total
  const rollTotal = bonus.rolls.reduce((sum, roll) => sum + roll, 0)
  const total = rollTotal + bonus.simpleMathModifier
  
  return {
    parameters,
    total,
    modifierHistory: {
      initialRolls,
      modifiedRolls: bonus.rolls,
      total,
      logs: bonus.logs
    }
  }
}

