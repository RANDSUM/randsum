import type { ModifierOptions } from '../../../types'
import { rerollPattern } from '../../patterns/modifierPatterns'

export function parseRerollModifier(notation: string): Pick<ModifierOptions, 'reroll'> {
  const matches = Array.from(notation.matchAll(new RegExp(rerollPattern.source, 'g')))
  if (matches.length === 0) return {}

  const reroll: {
    max?: number
    greaterThan?: number
    lessThan?: number
    exact?: number[]
  } = {}

  for (const match of matches) {
    const conditions = match[1]
    const maxCount = match[2] ? Number(match[2]) : undefined

    if (maxCount) {
      reroll.max = maxCount
    }

    if (conditions) {
      const parts = conditions.split(',').map(s => s.trim())

      for (const part of parts) {
        if (part.startsWith('>')) {
          reroll.greaterThan = Number(part.slice(1))
        } else if (part.startsWith('<')) {
          reroll.lessThan = Number(part.slice(1))
        } else if (/^\d+$/.test(part)) {
          reroll.exact ??= []
          reroll.exact.push(Number(part))
        }
      }
    }
  }

  return Object.keys(reroll).length > 0 ? { reroll } : {}
}
