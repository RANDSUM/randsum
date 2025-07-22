import { roll } from './roll'
import type { RollArgument } from './types/core'
import type { RollerRollResult } from './types/roll'

type BaseWrapperConfig<T, U, V, W> = {
  validateInput?: (arg: U) => void
  toArg: (arg: U) => RollArgument<T>[]
} & (
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
}: BaseWrapperConfig<T, U, V, W>): (arg: U) => V {
  return (arg) => {
    if (validateInput) validateInput(arg)
    const result = roll(...toArg(arg))
    if (validateResult) {
      return toValidatedResult(validateResult(result, arg), arg)
    }
    return toResult ? toResult(result, arg) : (result as V)
  }
}
