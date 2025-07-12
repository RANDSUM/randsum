import type { RollArgument } from '../../types'
import { isDiceNotation } from './isDiceNotation'
import { isRollOptions } from './isRollOptions'

export function isRollArgument(argument: unknown): argument is RollArgument {
  return (
    isDiceNotation(argument) ||
    isRollOptions(argument) ||
    typeof argument === 'number' ||
    (typeof argument === 'string' && !isNaN(Number(argument)))
  )
}
