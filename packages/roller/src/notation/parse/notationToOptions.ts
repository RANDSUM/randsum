import { coreNotationPattern } from '../coreNotationPattern'
import type { ParsedNotationOptions } from '../types'
import { listOfNotations } from './listOfNotations'
import { singleNotationToOptions } from './singleNotationToOptions'

const globalCoreNotationPattern = new RegExp(coreNotationPattern.source, 'g')

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

  const coreMatches = Array.from(notationString.matchAll(globalCoreNotationPattern))

  if (coreMatches.length <= 1) {
    return [singleNotationToOptions(notationString)]
  }

  return listOfNotations(notationString, coreMatches).map(singleNotationToOptions)
}
