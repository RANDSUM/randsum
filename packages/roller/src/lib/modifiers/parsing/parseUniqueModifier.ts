import type { ModifierOptions } from '../../../types'
import { uniquePattern } from '../../patterns/modifierPatterns'

export function parseUniqueModifier(notation: string): Pick<ModifierOptions, 'unique'> {
  const match = notation.match(uniquePattern)
  if (!match) return {}

  if (!match[2]) {
    return { unique: true }
  }

  const notUnique = match[2].split(',').map(s => Number(s.trim()))
  return { unique: { notUnique } }
}
