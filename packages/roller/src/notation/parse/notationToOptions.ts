import { coreNotationPattern } from '../coreNotationPattern'
import { NotationParseError } from '../../errors'
import type { ParsedNotationOptions } from '../types'
import { listOfNotations } from './listOfNotations'
import { singleNotationToOptions } from './singleNotationToOptions'
import { parseSpecialPoolSegment } from './parseSpecialPool'

/**
 * Upper bound for a single repeat operator (`xN`).
 * Protects against oversized result arrays from a single `xN` operator.
 */
export const MAX_REPEAT_COUNT = 1000

/**
 * Upper bound for how many nested `xN` operators may appear in one notation.
 * Protects against exponential blow-up like `1d6x10x10x10...` chains.
 */
export const MAX_REPEAT_DEPTH = 10

const repeatPattern = /[Xx]([1-9]\d*)$/

function parseRepeat(input: string): { base: string; count: number } | null {
  const match = repeatPattern.exec(input)
  if (!match) return null
  return { base: input.slice(0, match.index), count: Number(match[1]) }
}

function notationToOptionsInternal(notationString: string, depth: number): ParsedNotationOptions[] {
  if (notationString.length > 1000) return []

  const repeat = parseRepeat(notationString)
  if (repeat) {
    if (depth >= MAX_REPEAT_DEPTH) {
      throw new NotationParseError(
        notationString,
        `repeat nesting depth exceeds maximum of ${MAX_REPEAT_DEPTH}`
      )
    }
    if (repeat.count > MAX_REPEAT_COUNT) {
      throw new NotationParseError(
        notationString,
        `repeat count ${repeat.count} exceeds maximum of ${MAX_REPEAT_COUNT}`
      )
    }
    const baseOptions = notationToOptionsInternal(repeat.base, depth + 1)
    return Array.from({ length: repeat.count }, () => baseOptions).flat()
  }

  // notationToOptions only handles standard NdS pools and their modifiers.
  // Special dice (d%, gN, DDN, dF, d{...}) in multi-pool context are handled
  // by splitMultiPoolString in parseArguments.ts which recurses per segment.
  // Here we only need to split standard NdS multi-pool strings.
  const globalCorePattern = new RegExp(coreNotationPattern.source, 'g')
  const coreMatches = Array.from(notationString.matchAll(globalCorePattern))

  if (coreMatches.length <= 1) {
    // Single standard pool (or no standard pool — might be special die)
    const special = parseSpecialPoolSegment(notationString)
    if (special !== null) {
      return [{ quantity: special.quantity, sides: special.sides, arithmetic: special.arithmetic }]
    }
    return [singleNotationToOptions(notationString)]
  }

  // Multi standard NdS pools: split and parse each
  return listOfNotations(notationString, coreMatches).map(singleNotationToOptions)
}

export function notationToOptions(notationString: string): ParsedNotationOptions[] {
  return notationToOptionsInternal(notationString, 0)
}
