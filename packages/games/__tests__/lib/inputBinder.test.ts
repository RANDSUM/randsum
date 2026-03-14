import { describe, expect, test } from 'bun:test'
import { bindInteger } from '../../src/lib/inputBinder'
import { SchemaError } from '../../src/lib/errors'

describe('bindInteger', () => {
  test('returns number directly for literal values', () => {
    expect(bindInteger(42, {})).toBe(42)
  })

  test('resolves $input reference from input', () => {
    expect(bindInteger({ $input: 'bonus' }, { bonus: 7 })).toBe(7)
  })

  test('resolves conditional $input with ifTrue/ifFalse (truthy)', () => {
    expect(bindInteger({ $input: 'big', ifTrue: 20, ifFalse: 6 }, { big: true })).toBe(20)
  })

  test('resolves conditional $input with ifTrue/ifFalse (falsy)', () => {
    expect(bindInteger({ $input: 'big', ifTrue: 20, ifFalse: 6 }, { big: false })).toBe(6)
  })

  test('resolves conditional $input with undefined input (falsy)', () => {
    expect(bindInteger({ $input: 'big', ifTrue: 20, ifFalse: 6 }, {})).toBe(6)
  })

  test('throws INPUT_NOT_FOUND when required input is missing', () => {
    expect(() => bindInteger({ $input: 'bonus' }, {})).toThrow(SchemaError)
    expect(() => bindInteger({ $input: 'bonus' }, {})).toThrow('Required input "bonus"')
  })

  test('throws INVALID_INPUT_TYPE when input is not a number', () => {
    expect(() => bindInteger({ $input: 'bonus' }, { bonus: 'hello' })).toThrow(SchemaError)
    expect(() => bindInteger({ $input: 'bonus' }, { bonus: 'hello' })).toThrow('must be a number')
  })
})
