import { customCoreNotationPattern } from './patterns'
import type { CustomDiceNotation, CustomRollConfigArgument } from './types'

export function isCustomRollConfigArgument(
  arg: unknown
): arg is CustomRollConfigArgument {
  return typeof arg === 'object' && !!arg && 'faces' in arg
}

export function isCustomDiceNotation(arg: unknown): arg is CustomDiceNotation {
  const isAString = typeof arg === 'string'
  const basicTest = !!customCoreNotationPattern.test(String(arg))
  return isAString && basicTest && arg.includes('{') && arg.includes('}')
}
