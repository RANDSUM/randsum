import type { ParsedNotationOptions } from '../types'
import { coreNotationPattern } from '../coreNotationPattern'
import { parseModifiers } from './parseModifiers'

const labelPattern = /\[([^\]]+)\]/

function extractLabel(notation: string): { cleaned: string; label?: string } {
  const match = labelPattern.exec(notation)
  if (!match) return { cleaned: notation }
  const cleaned = notation.replace(labelPattern, '')
  const label = match[1]
  if (label === undefined) return { cleaned }
  return { cleaned, label }
}

export function singleNotationToOptions(notationString: string): ParsedNotationOptions {
  const trimmedNotationString = notationString.trim()
  const { cleaned, label } = extractLabel(trimmedNotationString)
  const coreNotationMatch = cleaned.match(coreNotationPattern)?.at(0) ?? ''
  const modifiersString = cleaned.replace(coreNotationMatch, '')
  const [quantityNot, sidesNotation = ''] = coreNotationMatch.split(/[Dd]/)

  const core: ParsedNotationOptions = {
    quantity: Math.abs(Number(quantityNot)),
    arithmetic: Number(quantityNot) < 0 ? ('subtract' as const) : ('add' as const),
    sides: Number(sidesNotation)
  }

  if (label !== undefined) {
    core.label = label
  }

  if (modifiersString.length === 0) {
    return core
  }

  return {
    ...core,
    modifiers: parseModifiers(modifiersString)
  }
}
