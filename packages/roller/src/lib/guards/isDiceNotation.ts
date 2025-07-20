import { completeRollPattern, coreNotationPattern } from '../patterns'
import type { DiceNotation } from '../../types'

export function isDiceNotation(argument: unknown): argument is DiceNotation {
  if (typeof argument !== 'string') return false
  const trimmedArg = argument.trim()
  const basicTest = !!coreNotationPattern.test(trimmedArg)
  if (!basicTest) return false

  const cleanArg = trimmedArg.replace(/\s/g, '').replace(' ', '')
  return cleanArg.replace(completeRollPattern, '').length === 0
}
