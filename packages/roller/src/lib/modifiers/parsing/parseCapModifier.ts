import type { ModifierOptions } from '../../../types'
import { capPattern } from '../../patterns/modifierPatterns'
import { parseComparisonNotation } from '../../comparisonUtils'

export function parseCapModifier(notation: string): Pick<ModifierOptions, 'cap'> {
  const match = notation.match(capPattern)
  if (!match?.[1]) return {}

  const cap = parseComparisonNotation(`{${match[1]}}`)
  return { cap }
}
