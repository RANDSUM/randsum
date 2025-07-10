import { roll } from '../roll'
import type { CustomRollArgument, CustomRollResult } from '../types'
import { argToOption } from './argToOption'

export default function rollCustom<T>(
  arg: CustomRollArgument<T>
): CustomRollResult<T> {
  const { faces, quantity } = argToOption(arg)

  const result = roll({
    sides: faces.length,
    quantity
  })

  const rolls = result.rolls
    .map((roll) => faces[roll - 1])
    .filter((r) => r !== undefined)
  return { result, rolls }
}
