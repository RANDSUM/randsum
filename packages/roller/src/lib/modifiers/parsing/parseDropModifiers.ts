import type { ModifierOptions } from '../../../types'
import {
  dropConstraintsPattern,
  dropHighestPattern,
  dropLowestPattern
} from '../../patterns/modifierPatterns'

export function parseDropModifiers(notation: string): Pick<ModifierOptions, 'drop'> {
  const drop: {
    highest?: number
    lowest?: number
    greaterThan?: number
    lessThan?: number
    exact?: number[]
  } = {}

  const highestMatch = notation.match(dropHighestPattern)
  if (highestMatch) {
    drop.highest = highestMatch[1] ? Number(highestMatch[1]) : 1
  }

  const lowestMatch = notation.match(dropLowestPattern)
  if (lowestMatch) {
    drop.lowest = lowestMatch[1] ? Number(lowestMatch[1]) : 1
  }

  const constraintsMatch = notation.match(dropConstraintsPattern)
  if (constraintsMatch) {
    const constraints = constraintsMatch[1]
    if (constraints) {
      const parts = constraints.split(',').map(s => s.trim())

      for (const part of parts) {
        if (part.startsWith('>')) {
          drop.greaterThan = Number(part.slice(1))
        } else if (part.startsWith('<')) {
          drop.lessThan = Number(part.slice(1))
        } else if (/^\d+$/.test(part)) {
          drop.exact ??= []
          drop.exact.push(Number(part))
        }
      }
    }
  }

  return Object.keys(drop).length > 0 ? { drop } : {}
}
