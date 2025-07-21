import { completeRollPattern, coreNotationPattern } from './lib/patterns'
import type { DiceNotation } from './types/core'

export function isDiceNotation(argument: unknown): argument is DiceNotation {
  if (typeof argument !== 'string') return false
  const trimmedArg = argument.trim()
  const basicTest = !!coreNotationPattern.test(trimmedArg)
  if (!basicTest) return false

  const cleanArg = trimmedArg.replace(/\s/g, '').replace(' ', '')
  const remaining = cleanArg.replaceAll(completeRollPattern, '')
  return remaining.length === 0
}
