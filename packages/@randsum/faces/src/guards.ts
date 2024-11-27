import { customCoreNotationPattern } from './patterns'
import type {
  CustomFacesDiceNotation,
  CustomFacesRollConfigArgument
} from './types'

export function isCustomFacesRollConfigArgument(
  arg: unknown
): arg is CustomFacesRollConfigArgument {
  return typeof arg === 'object' && !!arg && 'faces' in arg
}

export function isCustomDiceNotation(
  arg: unknown
): arg is CustomFacesDiceNotation {
  const isAString = typeof arg === 'string'
  const basicTest = !!customCoreNotationPattern.test(String(arg))
  return isAString && basicTest && arg.includes('{') && arg.includes('}')
}
