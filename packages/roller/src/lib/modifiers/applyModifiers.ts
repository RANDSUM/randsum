import type {
  NumericRollBonus,
  DropModifier,
  RerollModifier,
  CapModifier,
  ReplaceModifier,
  UniqueModifier,
  RequiredNumericRollParameters
} from '../../types'
import { matchesQuery, matchesReplaceFrom } from '../comparisonUtils'

// Export all apply functions for use in tests
export { applyModifiers } from './index'

/**
 * Apply plus modifier
 */
export function applyPlus(
  value: number | undefined,
  bonus: NumericRollBonus
): NumericRollBonus {
  if (value === undefined) return bonus
  
  return {
    ...bonus,
    simpleMathModifier: bonus.simpleMathModifier + value
  }
}

/**
 * Apply minus modifier
 */
export function applyMinus(
  value: number | undefined,
  bonus: NumericRollBonus
): NumericRollBonus {
  if (value === undefined) return bonus
  
  return {
    ...bonus,
    simpleMathModifier: bonus.simpleMathModifier - value
  }
}

/**
 * Apply cap modifier
 */
export function applyCap(
  cap: CapModifier | undefined,
  bonus: NumericRollBonus
): NumericRollBonus {
  if (!cap) return bonus
  
  const removed: number[] = []
  const added: number[] = []
  
  const cappedRolls = bonus.rolls.map(roll => {
    let cappedValue = roll
    
    if (cap.greaterThan !== undefined && roll > cap.greaterThan) {
      removed.push(roll)
      cappedValue = cap.greaterThan
      added.push(cappedValue)
    } else if (cap.lessThan !== undefined && roll < cap.lessThan) {
      removed.push(roll)
      cappedValue = cap.lessThan
      added.push(cappedValue)
    }
    
    return cappedValue
  })
  
  const logs = [...bonus.logs]
  if (removed.length > 0) {
    logs.push({
      modifier: 'cap',
      options: cap,
      removed,
      added
    })
  }
  
  return {
    ...bonus,
    rolls: cappedRolls,
    logs
  }
}

/**
 * Apply drop modifier
 */
export function applyDrop(
  drop: DropModifier | undefined,
  bonus: NumericRollBonus
): NumericRollBonus {
  if (!drop) return bonus
  
  let workingRolls = [...bonus.rolls]
  const removed: number[] = []
  
  // Track which indices to remove (but don't remove yet)
  const toRemoveIndices = new Set<number>()
  
  // Mark exact values for removal
  if (drop.exact && drop.exact.length > 0) {
    for (let i = 0; i < workingRolls.length; i++) {
      if (drop.exact.includes(workingRolls[i]!)) {
        toRemoveIndices.add(i)
      }
    }
  }
  
  // Mark by comparison
  if (drop.greaterThan !== undefined) {
    for (let i = 0; i < workingRolls.length; i++) {
      if (workingRolls[i]! > drop.greaterThan) {
        toRemoveIndices.add(i)
      }
    }
  }
  
  if (drop.lessThan !== undefined) {
    for (let i = 0; i < workingRolls.length; i++) {
      if (workingRolls[i]! < drop.lessThan) {
        toRemoveIndices.add(i)
      }
    }
  }
  
  // Filter out already marked indices for lowest/highest calculations
  const remainingRolls = workingRolls.filter((_, i) => !toRemoveIndices.has(i))
  
  // Drop lowest
  if (drop.lowest !== undefined && drop.lowest > 0 && remainingRolls.length > 0) {
    const sorted = [...remainingRolls].sort((a, b) => a - b)
    const toDrop = sorted.slice(0, drop.lowest)
    
    for (const value of toDrop) {
      // Find the index in the original array
      for (let i = 0; i < workingRolls.length; i++) {
        if (!toRemoveIndices.has(i) && workingRolls[i] === value) {
          toRemoveIndices.add(i)
          break
        }
      }
    }
  }
  
  // Recalculate remaining for highest
  const remainingForHighest = workingRolls.filter((_, i) => !toRemoveIndices.has(i))
  
  // Drop highest
  if (drop.highest !== undefined && drop.highest > 0 && remainingForHighest.length > 0) {
    const sorted = [...remainingForHighest].sort((a, b) => b - a)
    const toDrop = sorted.slice(0, drop.highest)
    
    for (const value of toDrop) {
      // Find the index in the original array
      for (let i = 0; i < workingRolls.length; i++) {
        if (!toRemoveIndices.has(i) && workingRolls[i] === value) {
          toRemoveIndices.add(i)
          break
        }
      }
    }
  }
  
  // Now actually remove and track
  const newRolls: number[] = []
  for (let i = 0; i < workingRolls.length; i++) {
    if (toRemoveIndices.has(i)) {
      removed.push(workingRolls[i]!)
    } else {
      newRolls.push(workingRolls[i]!)
    }
  }
  
  const logs = [...bonus.logs]
  if (removed.length > 0) {
    logs.push({
      modifier: 'drop',
      options: drop,
      removed,
      added: []
    })
  }
  
  return {
    ...bonus,
    rolls: newRolls,
    logs
  }
}

/**
 * Apply reroll modifier
 */
export function applyReroll(
  reroll: RerollModifier | undefined,
  bonus: NumericRollBonus,
  context?: RequiredNumericRollParameters,
  rollOne?: () => number
): NumericRollBonus {
  if (!reroll) return bonus
  
  if (!rollOne || !context) {
    throw new Error('rollOne function required for reroll modifier')
  }
  
  const maxAttempts = reroll.max ?? 99
  const removed: number[] = []
  const added: number[] = []
  
  const rerolledRolls = bonus.rolls.map(roll => {
    if (matchesQuery(roll, reroll)) {
      removed.push(roll)
      
      let newRoll = rollOne()
      let attempts = 0
      
      while (matchesQuery(newRoll, reroll) && attempts < maxAttempts) {
        newRoll = rollOne()
        attempts++
      }
      
      added.push(newRoll)
      return newRoll
    }
    
    return roll
  })
  
  const logs = [...bonus.logs]
  if (removed.length > 0) {
    logs.push({
      modifier: 'reroll',
      options: reroll,
      removed,
      added
    })
  }
  
  return {
    ...bonus,
    rolls: rerolledRolls,
    logs
  }
}

/**
 * Apply explode modifier
 */
export function applyExplode(
  explode: boolean | undefined,
  bonus: NumericRollBonus,
  context?: RequiredNumericRollParameters,
  rollOne?: () => number
): NumericRollBonus {
  if (!explode) return bonus
  
  if (!rollOne || !context) {
    throw new Error('rollOne and context required for explode modifier')
  }
  
  const added: number[] = []
  const maxValue = context.sides
  
  for (const roll of bonus.rolls) {
    if (roll === maxValue) {
      const newRoll = rollOne()
      added.push(newRoll)
    }
  }
  
  const logs = [...bonus.logs]
  if (added.length > 0) {
    logs.push({
      modifier: 'explode',
      options: true,
      removed: [],
      added
    })
  }
  
  return {
    ...bonus,
    rolls: [...bonus.rolls, ...added],
    logs
  }
}

/**
 * Apply unique modifier
 */
export function applyUnique(
  unique: UniqueModifier | undefined,
  bonus: NumericRollBonus,
  context?: RequiredNumericRollParameters,
  rollOne?: () => number
): NumericRollBonus {
  if (!unique) return bonus
  
  if (!rollOne || !context) {
    throw new Error('rollOne and context required for unique modifier')
  }
  
  const notUnique = typeof unique === 'object' ? unique.notUnique : []
  const removed: number[] = []
  const added: number[] = []
  
  // Check if we have more rolls than sides (impossible to make unique)
  const uniqueableRolls = bonus.rolls.filter(roll => !notUnique.includes(roll))
  if (uniqueableRolls.length > context.sides) {
    throw new Error('Cannot have more rolls than sides when unique is enabled')
  }
  
  const seen = new Set<number>()
  const uniqueRolls = bonus.rolls.map(roll => {
    // If this value is allowed to be non-unique, don't check it
    if (notUnique.includes(roll)) {
      return roll
    }
    
    // If we've seen this value before, reroll
    if (seen.has(roll)) {
      removed.push(roll)
      
      let newRoll = rollOne()
      let attempts = 0
      const maxAttempts = 100
      
      while ((seen.has(newRoll) || newRoll === roll) && attempts < maxAttempts) {
        newRoll = rollOne()
        attempts++
      }
      
      seen.add(newRoll)
      added.push(newRoll)
      return newRoll
    }
    
    seen.add(roll)
    return roll
  })
  
  const logs = [...bonus.logs]
  logs.push({
    modifier: 'unique',
    options: unique,
    removed,
    added
  })
  
  return {
    ...bonus,
    rolls: uniqueRolls,
    logs
  }
}

/**
 * Apply replace modifier
 */
export function applyReplace(
  replace: ReplaceModifier | ReplaceModifier[] | undefined,
  bonus: NumericRollBonus
): NumericRollBonus {
  if (!replace) return bonus
  
  const rules = Array.isArray(replace) ? replace : [replace]
  const removed: number[] = []
  const added: number[] = []
  
  const replacedRolls = bonus.rolls.map(roll => {
    for (const rule of rules) {
      if (matchesReplaceFrom(roll, rule.from)) {
        removed.push(roll)
        added.push(rule.to)
        return rule.to
      }
    }
    
    return roll
  })
  
  const logs = [...bonus.logs]
  if (removed.length > 0) {
    logs.push({
      modifier: 'replace',
      options: replace,
      removed,
      added
    })
  }
  
  return {
    ...bonus,
    rolls: replacedRolls,
    logs
  }
}

