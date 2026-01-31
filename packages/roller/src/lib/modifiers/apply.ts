import type {
  ComparisonOptions,
  DropOptions,
  KeepOptions,
  ReplaceOptions,
  RequiredNumericRollParameters,
  RerollOptions,
  SuccessCountOptions,
  UniqueOptions
} from '../../types'
import { matchesComparison } from '../comparisonUtils'

export function applyCap(
  value: number,
  { greaterThan, lessThan }: ComparisonOptions,
  replacementValue?: number
): number {
  let result = value

  if (greaterThan !== undefined && result > greaterThan) {
    result = replacementValue ?? greaterThan
  }

  if (lessThan !== undefined && result < lessThan) {
    result = replacementValue ?? lessThan
  }

  return result
}

export function applyCapping(rolls: number[], options: ComparisonOptions): number[] {
  return rolls.map(roll => applyCap(roll, options))
}

export function applyDropping(rolls: number[], options: DropOptions): number[] {
  const { highest, lowest, greaterThan, lessThan, exact } = options

  const exactSet = exact ? new Set(exact) : null
  let result = rolls.filter(roll => {
    if (greaterThan !== undefined && roll > greaterThan) return false
    if (lessThan !== undefined && roll < lessThan) return false
    if (exactSet?.has(roll)) return false
    return true
  })

  if (highest !== undefined || lowest !== undefined) {
    const indexedRolls = result.map((roll, index) => ({ roll, index }))
    indexedRolls.sort((a, b) => a.roll - b.roll)

    const indicesToDrop = new Set<number>()

    if (lowest !== undefined) {
      for (let i = 0; i < Math.min(lowest, indexedRolls.length); i++) {
        const roll = indexedRolls[i]
        if (roll) {
          indicesToDrop.add(roll.index)
        }
      }
    }

    if (highest !== undefined) {
      for (let i = indexedRolls.length - 1; i >= Math.max(0, indexedRolls.length - highest); i--) {
        const roll = indexedRolls[i]
        if (roll) {
          indicesToDrop.add(roll.index)
        }
      }
    }

    result = result.filter((_, index) => !indicesToDrop.has(index))

    if (lowest !== undefined && highest === undefined) {
      result.sort((a, b) => a - b)
    }
  }

  return result
}

export function applyKeeping(rolls: number[], options: KeepOptions): number[] {
  // Convert keep to drop internally
  const { highest, lowest } = options
  const quantity = rolls.length

  if (highest !== undefined) {
    // Keep N highest = drop (quantity - N) lowest
    return applyDropping(rolls, { lowest: quantity - highest })
  }
  if (lowest !== undefined) {
    // Keep N lowest = drop (quantity - N) highest
    return applyDropping(rolls, { highest: quantity - lowest })
  }
  return rolls
}

export function applyExploding(
  rolls: number[],
  { sides }: RequiredNumericRollParameters,
  rollOne: () => number,
  maxDepth = 1
): number[] {
  const result = [...rolls]
  let explosions = rolls.filter(r => r === sides)
  let depth = 0
  const effectiveMaxDepth = maxDepth === 0 ? 100 : maxDepth // 0 = unlimited (capped at 100 for safety)

  while (explosions.length > 0 && depth < effectiveMaxDepth) {
    const newRolls = explosions.map(() => rollOne())
    result.push(...newRolls)
    explosions = newRolls.filter(r => r === sides)
    depth++
  }

  return result
}

export function applyRerolling(
  rolls: number[],
  options: RerollOptions,
  rollOne: () => number
): number[] {
  const { max } = options
  let globalRerollCount = 0

  return rolls.map(roll => {
    if (max !== undefined && globalRerollCount >= max) {
      return roll // Don't reroll if we've hit the global limit
    }

    const result = rerollSingle(roll, options, rollOne)
    if (result !== roll) {
      globalRerollCount++
    }
    return result
  })
}

function rerollSingle(
  roll: number,
  options: RerollOptions,
  rollOne: () => number,
  attempt = 0
): number {
  if (attempt >= 99) {
    return roll
  }

  if (matchesComparison(roll, options)) {
    return rerollSingle(rollOne(), options, rollOne, attempt + 1)
  }

  return roll
}

export function applyReplacing(
  rolls: number[],
  options: ReplaceOptions | ReplaceOptions[]
): number[] {
  const replaceRules = Array.isArray(options) ? options : [options]
  let result = [...rolls]

  for (const { from, to } of replaceRules) {
    result = result.map(roll => {
      if (typeof from === 'object') {
        // Comparison-based replacement
        return applyCap(roll, from, to)
      } else {
        // Exact value replacement
        return roll === from ? to : roll
      }
    })
  }

  return result
}

export function applyUnique(
  rolls: number[],
  options: boolean | UniqueOptions,
  { sides }: RequiredNumericRollParameters,
  rollOne: () => number
): number[] {
  if (rolls.length > sides) {
    throw new Error('Cannot have more rolls than sides when unique is enabled')
  }

  const notUnique = typeof options === 'object' ? options.notUnique : []
  const notUniqueSet = new Set(notUnique)
  const seenValues = new Set<number>()
  const uniqueRolls: number[] = []

  for (const roll of rolls) {
    if (notUniqueSet.has(roll) || !seenValues.has(roll)) {
      // This value is allowed to repeat or hasn't been seen yet
      uniqueRolls.push(roll)
      seenValues.add(roll)
    } else {
      // Need to reroll for uniqueness
      let newRoll: number
      let attempts = 0
      const maxAttempts = sides * 10 // Safety limit

      do {
        newRoll = rollOne()
        attempts++
        if (attempts > maxAttempts) {
          // Fallback: use the original roll to avoid infinite loop
          newRoll = roll
          break
        }
      } while (seenValues.has(newRoll) && !notUniqueSet.has(newRoll))

      uniqueRolls.push(newRoll)
      seenValues.add(newRoll)
    }
  }

  return uniqueRolls
}

export function applySuccessCounting(rolls: number[], _options: SuccessCountOptions): number[] {
  // Success counting doesn't modify the rolls themselves,
  // but we need to return something. The actual counting
  // happens in the result calculation.
  // For now, return rolls unchanged - the count will be in the total
  return rolls
}

/**
 * Compounding exploding: when a die shows max value, add the rerolled value to that die
 * instead of creating a new die.
 */
export function applyCompounding(
  rolls: number[],
  { sides }: RequiredNumericRollParameters,
  rollOne: () => number,
  maxDepth = 1
): number[] {
  const effectiveMaxDepth = maxDepth === 0 ? 100 : maxDepth // 0 = unlimited (capped at 100 for safety)

  return rolls.map(roll => {
    if (roll !== sides) return roll

    let compoundValue = roll
    let compoundDepth = 0

    while (compoundDepth < effectiveMaxDepth) {
      const newRoll = rollOne()
      compoundValue += newRoll
      compoundDepth++
      if (newRoll !== sides) break
    }

    return compoundValue
  })
}

/**
 * Penetrating exploding: like compound, but subtract 1 from each subsequent roll.
 * This is the Hackmaster-style penetration dice mechanic.
 */
export function applyPenetrating(
  rolls: number[],
  { sides }: RequiredNumericRollParameters,
  rollOne: () => number,
  maxDepth = 1
): number[] {
  const effectiveMaxDepth = maxDepth === 0 ? 100 : maxDepth // 0 = unlimited (capped at 100 for safety)

  return rolls.map(roll => {
    if (roll !== sides) return roll

    let penetrateValue = roll
    let penetrateDepth = 0

    while (penetrateDepth < effectiveMaxDepth) {
      const newRoll = rollOne()
      // Subtract 1 from the roll (minimum 1)
      const adjustedRoll = Math.max(1, newRoll - 1)
      penetrateValue += adjustedRoll
      penetrateDepth++
      // Continue penetrating if we rolled max (before adjustment)
      if (newRoll !== sides) break
    }

    return penetrateValue
  })
}
