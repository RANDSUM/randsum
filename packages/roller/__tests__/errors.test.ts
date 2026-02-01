import { describe, expect, test } from 'bun:test'
import {
  ERROR_CODES,
  ModifierError,
  NotationParseError,
  RandsumError,
  RollError,
  ValidationError
} from '../src/errors'

describe('ERROR_CODES', () => {
  test('contains expected error codes', () => {
    expect(ERROR_CODES.INVALID_NOTATION).toBe('INVALID_NOTATION')
    expect(ERROR_CODES.MODIFIER_ERROR).toBe('MODIFIER_ERROR')
    expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ERROR_CODES.ROLL_ERROR).toBe('ROLL_ERROR')
  })
})

describe('RandsumError', () => {
  test('creates error with message and code', () => {
    const error = new RandsumError('test message', ERROR_CODES.ROLL_ERROR)

    expect(error.message).toBe('test message')
    expect(error.code).toBe('ROLL_ERROR')
    expect(error.name).toBe('RandsumError')
  })

  test('is instanceof Error', () => {
    const error = new RandsumError('test', ERROR_CODES.ROLL_ERROR)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RandsumError)
  })
})

describe('NotationParseError', () => {
  test('creates error without suggestion', () => {
    const error = new NotationParseError('xyz', 'not valid dice notation')

    expect(error.message).toBe('Invalid notation "xyz": not valid dice notation')
    expect(error.code).toBe('INVALID_NOTATION')
    expect(error.name).toBe('NotationParseError')
    expect(error.suggestion).toBeUndefined()
  })

  test('creates error with suggestion', () => {
    const error = new NotationParseError('d6', 'missing quantity', '1d6')

    expect(error.message).toBe('Invalid notation "d6": missing quantity. Did you mean "1d6"?')
    expect(error.code).toBe('INVALID_NOTATION')
    expect(error.name).toBe('NotationParseError')
    expect(error.suggestion).toBe('1d6')
  })

  test('is instanceof RandsumError', () => {
    const error = new NotationParseError('bad', 'reason')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RandsumError)
    expect(error).toBeInstanceOf(NotationParseError)
  })
})

describe('ModifierError', () => {
  test('creates error with modifier type and reason', () => {
    const error = new ModifierError('drop', 'cannot drop more dice than rolled')

    expect(error.message).toBe('Modifier error for "drop": cannot drop more dice than rolled')
    expect(error.code).toBe('MODIFIER_ERROR')
    expect(error.name).toBe('ModifierError')
  })

  test('is instanceof RandsumError', () => {
    const error = new ModifierError('reroll', 'invalid condition')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RandsumError)
    expect(error).toBeInstanceOf(ModifierError)
  })
})

describe('ValidationError', () => {
  test('creates error with message', () => {
    const error = new ValidationError('value must be positive')

    expect(error.message).toBe('Validation error: value must be positive')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.name).toBe('ValidationError')
  })

  test('is instanceof RandsumError', () => {
    const error = new ValidationError('invalid input')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RandsumError)
    expect(error).toBeInstanceOf(ValidationError)
  })
})

describe('RollError', () => {
  test('creates error with message', () => {
    const error = new RollError('roll failed')

    expect(error.message).toBe('roll failed')
    expect(error.code).toBe('ROLL_ERROR')
    expect(error.name).toBe('RollError')
  })

  test('is instanceof RandsumError', () => {
    const error = new RollError('something went wrong')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RandsumError)
    expect(error).toBeInstanceOf(RollError)
  })
})
