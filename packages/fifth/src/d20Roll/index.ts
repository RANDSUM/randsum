import {
  type NumericRollOptions,
  type NumericRollResult,
  roll as coreRoll
} from '@randsum/roller'
import type { FifthRollArgument } from '../types'
import { generateQuantity } from './generateQuantity'
import { generateModifiers } from './generateModifiers'

export function d20Roll({
  rollingWith,
  modifier = 0
}: FifthRollArgument): NumericRollResult {
  const rollArg: NumericRollOptions = {
    sides: 20,
    quantity: generateQuantity(rollingWith),
    modifiers: { ...generateModifiers(rollingWith), plus: modifier }
  }
  return coreRoll(rollArg)
}
