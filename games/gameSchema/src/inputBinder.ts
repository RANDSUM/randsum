import { SchemaError } from './errors'
import type { InputValue, IntegerOrInput, RollInput } from './types'

function isInputRef(value: IntegerOrInput): value is { readonly $input: string } {
  return typeof value === 'object' && '$input' in value
}

export function bindInteger(value: IntegerOrInput, input: RollInput): number {
  if (!isInputRef(value)) {
    return value
  }
  const key = value.$input
  const resolved = input[key]
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

export function bindValue(value: IntegerOrInput, input: RollInput): InputValue {
  if (!isInputRef(value)) {
    return value
  }
  const key = value.$input
  const resolved = input[key]
  if (resolved === undefined) {
    throw new SchemaError('INPUT_NOT_FOUND', `Required input "${key}" was not provided`)
  }
  return resolved
}
