import {
  type BaseGameRollResult,
  type RollOptions,
  roll as coreRoll
} from '@randsum/roller'
import type { FifthRollArgument } from '../types'
import { generateQuantity } from './generateQuantity'
import { generateModifiers } from './generateModifiers'

export function d20Roll({
  rollingWith,
  modifier = 0
}: FifthRollArgument): BaseGameRollResult<number> {
  const rollArg: RollOptions = {
    sides: 20,
    quantity: generateQuantity(rollingWith),
    modifiers: { ...generateModifiers(rollingWith), plus: modifier }
  }
  const details = coreRoll(rollArg)
  return {
    result: details.total,
    details
  }
}
