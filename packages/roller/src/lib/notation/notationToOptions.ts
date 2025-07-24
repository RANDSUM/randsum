import type { DiceNotation, RollOptions } from '../../types'
import { coreNotationPattern } from '../patterns'
import { listOfNotations } from './listOfNotations'
import { singleNotationToOptions } from './singleNotationToOptions'

const globalCoreNotationPattern = new RegExp(coreNotationPattern.source, 'g')

export function notationToOptions<T = string>(notationString: DiceNotation): RollOptions<T>[] {
  const coreMatches = Array.from(notationString.matchAll(globalCoreNotationPattern))

  if (coreMatches.length <= 1) {
    return [singleNotationToOptions(notationString)]
  }

  return listOfNotations(notationString, coreMatches).map(singleNotationToOptions<T>)
}
