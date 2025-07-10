import type { CustomRollArgument } from '../../../types'
import { isCustomDiceNotation } from '../notation/isCustomDiceNotation'
import { isCustomRollOptions } from '../options/isCustomRollOptions'
import { isD } from '../isD'

export function isCustomRollArgument(
  argument: unknown
): argument is CustomRollArgument {
  return (
    isCustomDiceNotation(argument) ||
    isCustomRollOptions(argument) ||
    (isD(argument) && argument.isCustom) ||
    (Array.isArray(argument) && argument.every((a) => typeof a === 'string'))
  )
}
