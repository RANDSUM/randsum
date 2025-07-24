import type { RollOptions } from '../../types/core'
import { coreNotationPattern } from '../patterns'
import { parseModifiers } from '../modifiers'

export function singleNotationToOptions<T>(notationString: string): RollOptions<T> {
  const trimmedNotationString = notationString.trim()
  const coreNotationMatch = trimmedNotationString.match(coreNotationPattern)?.at(0) ?? ''
  const modifiersString = trimmedNotationString.replace(coreNotationMatch, '')
  const [quantityNot, sidesNotation = ''] = coreNotationMatch.split(/[Dd]/)

  const core = {
    quantity: Math.abs(Number(quantityNot)),
    arithmetic: Number(quantityNot) < 0 ? ('subtract' as const) : ('add' as const),
    sides: Number(sidesNotation)
  }

  if (modifiersString.length === 0) {
    return core
  }

  return {
    ...core,
    modifiers: parseModifiers(modifiersString)
  }
}
