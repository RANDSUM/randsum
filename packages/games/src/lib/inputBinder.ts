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
    throw new SchemaError('INPUT_NOT_FOUND', `Required input "${key}" was not provided`)
  }
  if (typeof resolved !== 'number') {
    throw new SchemaError(
      'INVALID_INPUT_TYPE',
      `Input "${key}" must be a number, got ${typeof resolved}`
    )
  }
  return resolved
}
