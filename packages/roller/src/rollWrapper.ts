import { roll } from './roll'
import type { RollArgument } from './types/core'
import type { RollerRollResult } from './types/roll'

type BaseWrapperConfig<T, U, V, X> = (
  | {
      validateInput?: never
      toArg: (arg: U) => RollArgument<T>[]
    }
  | {
      validateInput: (arg: U) => X
      toArg: (arg: X) => RollArgument<T>[]
    }
) & {
  toResult?: (rollResult: RollerRollResult<T>, arg: U) => V
}

export function rollWrapper<
  T = string,
  U = RollArgument<T>,
  V = RollerRollResult<T>,
  X = unknown
>({
  toArg,
  toResult,
  validateInput
}: BaseWrapperConfig<T, U, V, X>): (arg: U) => V {
  return (arg) => {
    const usableArg = validateInput ? toArg(validateInput(arg)) : toArg(arg)
    const result = roll(...usableArg)
    return toResult ? toResult(result, arg) : (result as V)
  }
}
