import { roll } from './roll'
import type { RollArgument } from './types/core'
import type { RollerRollResult } from './types/roll'

export function rollWrapper<
  T = string,
  U = RollArgument<T>,
  V = RollerRollResult<T>
>(
  toArg: (arg: U) => RollArgument<T>,
  toResult: (rollResult: RollerRollResult<T>) => V
): (arg: U) => V {
  return (arg: U) => {
    const rollArg = toArg(arg)
    const rollResult = roll(rollArg)
    return toResult(rollResult)
  }
}
