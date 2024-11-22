import type { DiceNotation } from '@randsum/core'
import { completeRollPattern, coreNotationPattern } from './patterns'

export function isDiceNotation(argument: unknown): argument is DiceNotation {
  const notAString = typeof argument !== 'string'
  const basicTest = !!coreNotationPattern.test(String(argument))
  if (!basicTest || notAString) return false

  const cleanArg = argument.replace(/\s/g, '')

  return cleanArg.replace(completeRollPattern, '').length === 0
}
