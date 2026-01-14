import type { ModifierOptions } from '../../types'
import {
  capPattern,
  dropConstraintsPattern,
  dropHighestPattern,
  dropLowestPattern,
  explodePattern,
  minusPattern,
  plusPattern,
  replacePattern,
  rerollPattern,
  uniquePattern
} from '../patterns/modifierPatterns'

export function parseModifiers(notation: string): ModifierOptions {
  return {
    ...parseDropModifiers(notation),
    ...parseExplodeModifier(notation),
    ...parseUniqueModifier(notation),
    ...parseReplaceModifier(notation),
    ...parseRerollModifier(notation),
    ...parseCapModifier(notation),
    ...parseArithmeticModifiers(notation)
  }
}

export function parseArithmeticModifiers(
  notation: string
): Pick<ModifierOptions, 'plus' | 'minus'> {
  const result: { plus?: number; minus?: number } = {}

  const plusMatches = Array.from(notation.matchAll(new RegExp(plusPattern.source, 'g')))
  if (plusMatches.length > 0) {
    const total = plusMatches.reduce((sum, match) => sum + Number(match[1]), 0)
    result.plus = total
  }

  const minusMatches = Array.from(notation.matchAll(new RegExp(minusPattern.source, 'g')))
  if (minusMatches.length > 0) {
    const total = minusMatches.reduce((sum, match) => sum + Number(match[1]), 0)
    result.minus = total
  }

  return result
}

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

export function parseDropModifiers(notation: string): Pick<ModifierOptions, 'drop'> {
  const drop: {
    highest?: number
    lowest?: number
    greaterThan?: number
    lessThan?: number
    exact?: number[]
  } = {}

  const highestMatch = notation.match(dropHighestPattern)
  if (highestMatch) {
    drop.highest = highestMatch[1] ? Number(highestMatch[1]) : 1
  }

  const lowestMatch = notation.match(dropLowestPattern)
  if (lowestMatch) {
    drop.lowest = lowestMatch[1] ? Number(lowestMatch[1]) : 1
  }

  const constraintsMatch = notation.match(dropConstraintsPattern)
  if (constraintsMatch) {
    const constraints = constraintsMatch[1]
    if (constraints) {
      const parts = constraints.split(',').map(s => s.trim())

      for (const part of parts) {
        if (part.startsWith('>')) {
          drop.greaterThan = Number(part.slice(1))
        } else if (part.startsWith('<')) {
          drop.lessThan = Number(part.slice(1))
        } else if (/^\d+$/.test(part)) {
          drop.exact ??= []
          drop.exact.push(Number(part))
        }
      }
    }
  }

  return Object.keys(drop).length > 0 ? { drop } : {}
}

export function parseExplodeModifier(notation: string): Pick<ModifierOptions, 'explode'> {
  return explodePattern.test(notation) ? { explode: true } : {}
}

export function parseReplaceModifier(notation: string): Pick<ModifierOptions, 'replace'> {
  const match = notation.match(replacePattern)
  if (!match) return {}

  const content = match[1]
  if (!content) return {}
  const parts = content.split(',').map(s => s.trim())

  const replacements = parts.map(part => {
    const [fromPart, toPart] = part.split('=')
    if (!fromPart || !toPart) return { from: 0, to: 0 }

    let from: number | { greaterThan: number } | { lessThan: number }
    if (fromPart.startsWith('>')) {
      from = { greaterThan: Number(fromPart.slice(1)) }
    } else if (fromPart.startsWith('<')) {
      from = { lessThan: Number(fromPart.slice(1)) }
    } else {
      from = Number(fromPart)
    }

    return { from, to: Number(toPart) }
  })

  return { replace: replacements }
}

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

export function parseUniqueModifier(notation: string): Pick<ModifierOptions, 'unique'> {
  const match = notation.match(uniquePattern)
  if (!match) return {}

  if (!match[2]) {
    return { unique: true }
  }

  const notUnique = match[2].split(',').map(s => Number(s.trim()))
  return { unique: { notUnique } }
}
