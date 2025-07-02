import { completeRollPattern, coreNotationPattern } from './patterns'
import type { DiceNotation } from './types'

export function isDiceNotation(argument: unknown): argument is DiceNotation {
  const notAString = typeof argument !== 'string'
  const basicTest = !!coreNotationPattern.test(String(argument))
  if (!basicTest || notAString) return false

  const cleanArg = argument.replace(/\s/g, '')

  return cleanArg.replace(completeRollPattern, '').length === 0
}
