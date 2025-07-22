import { roll } from './roll'
import type { RollArgument } from './types/core'
import type { RollerRollResult } from './types/roll'

interface WrapperConfig<T, U, V> {
  toArg: (arg: U) => RollArgument<T>
  toResult: (rollResult: RollerRollResult<T>, arg: U) => V
}

export function rollWrapper<
  T = string,
  U = RollArgument<T>,
  V = RollerRollResult<T>
>({ toArg, toResult }: WrapperConfig<T, U, V>): (arg: U) => V {
  const func = function (arg: U): V {
    return toResult(roll(toArg(arg)), arg)
  }
  return func
}
