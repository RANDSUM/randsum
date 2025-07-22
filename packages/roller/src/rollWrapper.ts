import { roll } from './roll'
import type { RollArgument } from './types/core'
import type { RollerRollResult } from './types/roll'

interface WrapperConfig<T, U, V> {
  validateInput?: (arg: U) => void
  toArg: (arg: U) => RollArgument<T>[]
  toResult?: (rollResult: RollerRollResult<T>, arg: U) => V
}

export function rollWrapper<
  T = string,
  U = RollArgument<T>,
  V = RollerRollResult<T>
>({
  toArg,
  toResult = (rollResult) => rollResult as V,
  validateInput
}: WrapperConfig<T, U, V>): (arg: U) => V {
  return (arg) => {
    if (validateInput) validateInput(arg)
    return toResult(roll(...toArg(arg)), arg)
  }
}
