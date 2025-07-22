import { roll } from './roll'
import type { RollArgument } from './types/core'
import type { RollerRollResult } from './types/roll'

type BaseWrapperConfig<X, T, U, V, W> = (
  | {
      validateInput?: undefined
      toArg: (arg: U) => RollArgument<T>[]
    }
  | {
      validateInput: (arg: U) => X
      toArg: (arg: X) => RollArgument<T>[]
    }
) &
  (
    | {
        validateResult: (rollResult: RollerRollResult<T>, arg: U) => W
        toValidatedResult: (validatedResult: W, arg: U) => V
        toResult?: undefined
      }
    | {
        toResult?: (rollResult: RollerRollResult<T>, arg: U) => V
        validateResult?: undefined
        toValidatedResult?: undefined
      }
  )

export function rollWrapper<
  X = unknown,
  T = string,
  U = RollArgument<T>,
  V = RollerRollResult<T>,
  W = unknown
>({
  toArg,
  toResult,
  validateInput,
  validateResult,
  toValidatedResult
}: BaseWrapperConfig<X, T, U, V, W>): (arg: U) => V {
  return (arg) => {
    const usableArg = validateInput ? toArg(validateInput(arg)) : toArg(arg)
    const result = roll(...usableArg)
    if (validateResult) {
      return toValidatedResult(validateResult(result, arg), arg)
    }
    return toResult ? toResult(result, arg) : (result as V)
  }
}
