import type {
  CustomRollArgument,
  CustomRollResult,
  DicePool,
  NumericRollArgument,
  NumericRollResult,
  RollArgument,
  RollResult
} from './types'
import {
  generateKey,
  normalizeArgument,
  rollResultFromDicePools
} from './utils'

function roll(...args: NumericRollArgument[]): NumericRollResult
function roll(...args: CustomRollArgument[]): CustomRollResult
function roll(...args: (NumericRollArgument | CustomRollArgument)[]): RollResult
function roll(...args: RollArgument[]): RollResult {
  const dicePools: DicePool = {
    dicePools: Object.fromEntries(
      args.map((arg) => [generateKey(), normalizeArgument(arg)])
    )
  }

  return rollResultFromDicePools(dicePools)
}

export { roll }
