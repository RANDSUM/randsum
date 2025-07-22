import { roll } from './roll'
import type { RollArgument } from './types/core'
import type { RollerRollResult } from './types/roll'

type BaseWrapperConfig<T, U, V, W, X> = (
  | {
      validateInput?: never
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
        toResult?: never
      }
    | {
        toResult?: (rollResult: RollerRollResult<T>, arg: U) => V
        validateResult?: never
        toValidatedResult?: never
      }
  )

export function rollWrapper<
  T = string,
  U = RollArgument<T>,
  V = RollerRollResult<T>,
  W = unknown,
  X = unknown
>({
  toArg,
  toResult,
  validateInput,
  validateResult,
  toValidatedResult
}: BaseWrapperConfig<T, U, V, W, X>): (arg: U) => V {
  return (arg) => {
    const usableArg = validateInput ? toArg(validateInput(arg)) : toArg(arg)
    const result = roll(...usableArg)
    if (validateResult) {
      return toValidatedResult(validateResult(result, arg), arg)
    }
    return toResult ? toResult(result, arg) : (result as V)
  }
}
