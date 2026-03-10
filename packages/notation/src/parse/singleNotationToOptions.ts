import type { ParsedNotationOptions } from '../types'
import { coreNotationPattern } from '../coreNotationPattern'
import { parseModifiers } from './parseModifiers'

export function singleNotationToOptions(notationString: string): ParsedNotationOptions {
  const trimmedNotationString = notationString.trim()
  const coreNotationMatch = trimmedNotationString.match(coreNotationPattern)?.at(0) ?? ''
  const modifiersString = trimmedNotationString.replace(coreNotationMatch, '')
  const [quantityNot, sidesNotation = ''] = coreNotationMatch.split(/[Dd]/)

  const core: ParsedNotationOptions = {
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
