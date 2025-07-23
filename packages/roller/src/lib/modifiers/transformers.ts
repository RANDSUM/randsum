import type { RequiredNumericRollParameters } from '../../types/core'
import type {
  ComparisonOptions,
  DropOptions,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '../../types/modifiers'
import { applyCap, matchesComparison } from '../comparison'

export function applyCapping(
  rolls: number[],
  options: ComparisonOptions
): number[] {
  return rolls.map((roll) => applyCap(roll, options))
}

export function applyDropping(rolls: number[], options: DropOptions): number[] {
  const { highest, lowest, greaterThan, lessThan, exact } = options

  const exactSet = exact ? new Set(exact) : null
  let result = rolls.filter((roll) => {
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
      for (
        let i = indexedRolls.length - 1;
        i >= Math.max(0, indexedRolls.length - highest);
        i--
      ) {
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

export function applyRerolling(
  rolls: number[],
  options: RerollOptions,
  rollOne: () => number
): number[] {
  const { max } = options
  let globalRerollCount = 0

  return rolls.map((roll) => {
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

export function applyExploding(
  rolls: number[],
  context: RequiredNumericRollParameters,
  rollOne: () => number
): number[] {
  const { sides } = context
  let explodeCount = 0

  for (const roll of rolls) {
    if (roll === sides) {
      explodeCount++
    }
  }

  if (explodeCount === 0) {
    return rolls
  }

  const explodedRolls = [...rolls]
  for (let i = 0; i < explodeCount; i++) {
    explodedRolls.push(rollOne())
  }

  return explodedRolls
}

export function applyUnique(
  rolls: number[],
  options: boolean | UniqueOptions,
  context: RequiredNumericRollParameters,
  rollOne: () => number
): number[] {
  const { sides } = context

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

export function applyReplacing(
  rolls: number[],
  options: ReplaceOptions | ReplaceOptions[]
): number[] {
  const replaceRules = Array.isArray(options) ? options : [options]
  let result = [...rolls]

  for (const { from, to } of replaceRules) {
    result = result.map((roll) => {
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
