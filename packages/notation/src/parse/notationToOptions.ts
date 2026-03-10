import { coreNotationPattern } from '../coreNotationPattern'
import type { ParsedNotationOptions } from '../types'
import { listOfNotations } from './listOfNotations'
import { singleNotationToOptions } from './singleNotationToOptions'

const globalCoreNotationPattern = new RegExp(coreNotationPattern.source, 'g')

export function notationToOptions(notationString: string): ParsedNotationOptions[] {
  if (notationString.length > 1000) return []
  const coreMatches = Array.from(notationString.matchAll(globalCoreNotationPattern))

  if (coreMatches.length <= 1) {
    return [singleNotationToOptions(notationString)]
  }

  return listOfNotations(notationString, coreMatches).map(singleNotationToOptions)
}
