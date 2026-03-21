import type { ParsedNotationOptions } from '../types'
import { coreNotationPattern } from '../coreNotationPattern'
import { TTRPG_STANDARD_DIE_SET } from '../constants'
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

const inflationPattern = /![iI]/
const reductivePattern = /![rR]/

/**
 * Resolve inflation sugar (!i) to an explodeSequence array.
 * For standard dice: returns all TTRPG sizes strictly above the current die.
 * For non-standard dice: snaps UP to the nearest standard die, includes that and above.
 */
function resolveInflation(sides: number): number[] {
  const exactIndex = TTRPG_STANDARD_DIE_SET.indexOf(sides)
  if (exactIndex !== -1) {
    return TTRPG_STANDARD_DIE_SET.slice(exactIndex + 1)
  }
  const snapIndex = TTRPG_STANDARD_DIE_SET.findIndex(s => s >= sides)
  if (snapIndex === -1) return []
  return TTRPG_STANDARD_DIE_SET.slice(snapIndex)
}

/**
 * Resolve reductive sugar (!r) to an explodeSequence array.
 * For standard dice: returns all TTRPG sizes strictly below the current die, descending.
 * For non-standard dice: snaps DOWN to the nearest standard die <= sides, includes that and below.
 */
function resolveReductive(sides: number): number[] {
  const exactIndex = TTRPG_STANDARD_DIE_SET.indexOf(sides)
  if (exactIndex !== -1) {
    if (exactIndex === 0) return []
    const below = TTRPG_STANDARD_DIE_SET.slice(0, exactIndex)
    return [...below].reverse()
  }
  const snapIndex = findLastIndex(TTRPG_STANDARD_DIE_SET, s => s <= sides)
  if (snapIndex === -1) return []
  const below = TTRPG_STANDARD_DIE_SET.slice(0, snapIndex + 1)
  return [...below].reverse()
}

/**
 * Array.findLastIndex polyfill (for environments without it).
 */
function findLastIndex<T>(arr: readonly T[], predicate: (item: T) => boolean): number {
  for (const i of Array.from({ length: arr.length }, (_, idx) => arr.length - 1 - idx)) {
    const item = arr[i]
    if (item !== undefined && predicate(item)) return i
  }
  return -1
}

export function singleNotationToOptions(notationString: string): ParsedNotationOptions {
  const trimmedNotationString = notationString.trim()
  const { cleaned, label } = extractLabel(trimmedNotationString)
  const coreNotationMatch = cleaned.match(coreNotationPattern)?.at(0) ?? ''
  const modifiersString = cleaned.replace(coreNotationMatch, '')
  const [quantityNot, sidesNotation = ''] = coreNotationMatch.split(/[Dd]/)

  // Gap 44: The ABNF grammar defines a `mod-add-pool` rule for "+NdS" notation (adding a dice pool,
  // not a scalar). At the code level, this is handled by parsing each notation segment separately
  // (in notationToOptions.ts) and assigning `arithmetic: 'subtract' | 'add'` based on the leading sign.
  // The ABNF `mod-add-pool` and the `arithmetic` field are two different layers of the same concept:
  // the ABNF describes the syntax surface; `arithmetic` is the IR field that drives pool combination.
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

  const modifiers = parseModifiers(modifiersString)

  // Resolve !i and !r sugar into explodeSequence
  if (inflationPattern.test(modifiersString)) {
    modifiers.explodeSequence = resolveInflation(core.sides)
  } else if (reductivePattern.test(modifiersString)) {
    modifiers.explodeSequence = resolveReductive(core.sides)
  }

  return {
    ...core,
    modifiers
  }
}
