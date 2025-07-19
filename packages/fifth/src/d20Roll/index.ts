import {
  type RollOptions,
  type RollerRollResult,
  roll as coreRoll
} from '@randsum/roller'
import type { FifthRollArgument } from '../types'
import { generateQuantity } from './generateQuantity'
import { generateModifiers } from './generateModifiers'

export function d20Roll({
  rollingWith,
  modifier = 0
}: FifthRollArgument): RollerRollResult {
  const rollArg: RollOptions = {
    sides: 20,
    quantity: generateQuantity(rollingWith),
    modifiers: { ...generateModifiers(rollingWith), plus: modifier }
  }
  return coreRoll(rollArg)
}
