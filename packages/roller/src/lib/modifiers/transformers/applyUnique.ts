import type { RequiredNumericRollParameters } from '../../../types'
import type { UniqueOptions } from '../../../types'

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
