import { describe, expect, test } from 'bun:test'

import {
  ERROR_CODES,
  ModifierError,
  NotationParseError,
  RandsumError,
  RollError,
  ValidationError
} from '../../src/errors'

describe('security: error hierarchy', () => {
  test('ValidationError is instanceof RandsumError', () => {
    const err = new ValidationError('bad')
    expect(err).toBeInstanceOf(RandsumError)
    expect(err.code).toBe(ERROR_CODES.VALIDATION_ERROR)
  })

  test('ModifierError is instanceof RandsumError', () => {
    const err = new ModifierError('drop', 'bad')
    expect(err).toBeInstanceOf(RandsumError)
    expect(err.code).toBe(ERROR_CODES.MODIFIER_ERROR)
  })

  test('RollError is instanceof RandsumError', () => {
    const err = new RollError('bad')
    expect(err).toBeInstanceOf(RandsumError)
    expect(err.code).toBe(ERROR_CODES.ROLL_ERROR)
  })

  test('NotationParseError is instanceof RandsumError (unified)', () => {
    const err = new NotationParseError('xyz', 'not valid')
    expect(err).toBeInstanceOf(RandsumError)
    expect(err).toBeInstanceOf(NotationParseError)
    expect(err.code).toBe(ERROR_CODES.INVALID_NOTATION)
  })

  test('NotationParseError preserves suggestion and two-variant message', () => {
    const withoutSuggestion = new NotationParseError('xyz', 'not valid dice notation')
    expect(withoutSuggestion.message).toBe('Invalid notation "xyz": not valid dice notation')
    expect(withoutSuggestion.suggestion).toBeUndefined()

    const withSuggestion = new NotationParseError('d6', 'missing quantity', '1d6')
    expect(withSuggestion.message).toBe(
      'Invalid notation "d6": missing quantity. Did you mean "1d6"?'
    )
    expect(withSuggestion.suggestion).toBe('1d6')
  })

  test('every error in the hierarchy is also instanceof Error', () => {
    expect(new ValidationError('x')).toBeInstanceOf(Error)
    expect(new ModifierError('x', 'y')).toBeInstanceOf(Error)
    expect(new RollError('x')).toBeInstanceOf(Error)
    expect(new NotationParseError('x', 'y')).toBeInstanceOf(Error)
  })
})
