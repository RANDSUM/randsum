import { coreNotationPattern } from '../coreNotationPattern'
import type { ParsedNotationOptions } from '../types'
import { listOfNotations } from './listOfNotations'
import { singleNotationToOptions } from './singleNotationToOptions'
import { parseSpecialPoolSegment } from './parseSpecialPool'

// Matches standard NdS pools OR special numeric pools (d%, gN, DDN)
// Order: DDN before standard (two D's must be caught before one D)
const POOL_BOUNDARY_PATTERN = new RegExp(
  [
    coreNotationPattern.source,
    String.raw`[+-]?\d*[Dd][Dd]\d+`,
    String.raw`[+-]?\d*[Gg]\d+`,
    String.raw`[+-]?\d*[Dd]%`
  ].join('|'),
  'g'
)

const repeatPattern = /[Xx]([1-9]\d*)$/

/**
 * Detect and handle repeat operator (xN).
 * Returns the base notation (with xN stripped) and the repeat count,
 * or null if no repeat operator is present.
 */
function parseRepeat(input: string): { base: string; count: number } | null {
  const match = repeatPattern.exec(input)
  if (!match) return null

  return {
    base: input.slice(0, match.index),
    count: Number(match[1])
  }
}

export function notationToOptions(notationString: string): ParsedNotationOptions[] {
  if (notationString.length > 1000) return []

  const repeat = parseRepeat(notationString)
  if (repeat) {
    const baseOptions = notationToOptions(repeat.base)
    return Array.from({ length: repeat.count }, () => baseOptions).flat()
  }

  POOL_BOUNDARY_PATTERN.lastIndex = 0
  const poolMatches = Array.from(notationString.matchAll(POOL_BOUNDARY_PATTERN))

  if (poolMatches.length <= 1) {
    return [singleNotationToOptions(notationString)]
  }

  // Check if any pool matches are special (non-standard NdS)
  const hasSpecialPool = poolMatches.some(m => {
    const t = m[0]
    return /[Gg]\d+$/.test(t) || /[Dd][Dd]\d+$/.test(t) || /[Dd]%$/.test(t)
  })

  if (!hasSpecialPool) {
    // Pure standard NdS multi-pool — use existing path
    const coreMatches = Array.from(
      notationString.matchAll(new RegExp(coreNotationPattern.source, 'g'))
    )
    return listOfNotations(notationString, coreMatches).map(singleNotationToOptions)
  }

  // Mixed or all-special pools: split by pool boundaries and parse each segment
  return listOfNotations(notationString, poolMatches).map(segment => {
    const special = parseSpecialPoolSegment(segment)
    if (special !== null) {
      return { quantity: special.quantity, sides: special.sides, arithmetic: special.arithmetic }
    }
    return singleNotationToOptions(segment)
  })
}
