import type { ModifierOptions } from '../../../types'
import { minusPattern, plusPattern } from '../../patterns/modifierPatterns'

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
