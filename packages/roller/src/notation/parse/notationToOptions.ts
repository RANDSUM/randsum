import { coreNotationPattern } from '../coreNotationPattern'
import type { ParsedNotationOptions } from '../types'
import { listOfNotations } from './listOfNotations'
import { singleNotationToOptions } from './singleNotationToOptions'
import { parseSpecialPoolSegment } from './parseSpecialPool'

const repeatPattern = /[Xx]([1-9]\d*)$/

function parseRepeat(input: string): { base: string; count: number } | null {
  const match = repeatPattern.exec(input)
  if (!match) return null
  return { base: input.slice(0, match.index), count: Number(match[1]) }
}

export function notationToOptions(notationString: string): ParsedNotationOptions[] {
  if (notationString.length > 1000) return []

  const repeat = parseRepeat(notationString)
  if (repeat) {
    const baseOptions = notationToOptions(repeat.base)
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
