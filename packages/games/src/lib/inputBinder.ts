import { SchemaError } from './errors'
import { isConditionalRef, isInputRef } from './typeGuards'
import type { IntegerOrInput, RollInput } from './types'

export function bindInteger(value: IntegerOrInput, input: RollInput): number {
  if (!isInputRef(value)) {
    return value
  }
  const key = value.$input
  const resolved = input[key]
  if (isConditionalRef(value)) {
    return resolved ? value.ifTrue : value.ifFalse
  }
  if (resolved === undefined) {
    throw new SchemaError(`Required input "${key}" was not provided`, 'INPUT_NOT_FOUND')
  }
  if (typeof resolved !== 'number') {
    throw new SchemaError(
      `Input "${key}" must be a number, got ${typeof resolved}`,
      'INVALID_INPUT_TYPE'
    )
  }
  return resolved
}
