import type { ModifierOptions } from '../../../types'
import { capPattern } from '../../patterns/modifierPatterns'

export function parseCapModifier(notation: string): Pick<ModifierOptions, 'cap'> {
  const match = notation.match(capPattern)
  if (!match) return {}

  const cap: {
    greaterThan?: number
    lessThan?: number
  } = {}
  const conditions = match[1]
  if (!conditions) return {}

  const parts = conditions.split(',').map(s => s.trim())

  for (const part of parts) {
    if (part.startsWith('>')) {
      cap.greaterThan = Number(part.slice(1))
    } else if (part.startsWith('<')) {
      cap.lessThan = Number(part.slice(1))
    }
  }

  return { cap }
}
