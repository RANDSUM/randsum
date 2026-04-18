import { describe, expect, test } from 'bun:test'

import {
  ERROR_CODES,
  ModifierError,
  NotationParseError,
  RandsumError,
  RollError,
  ValidationError
} from '../../src/errors'
import { roll } from '../../src/roll'

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

describe('error context: structured diagnostics', () => {
  test('context is undefined when not provided (backward compatible)', () => {
    expect(new ValidationError('bad').context).toBeUndefined()
    expect(new ModifierError('drop', 'bad').context).toBeUndefined()
    expect(new RollError('bad').context).toBeUndefined()
  })

  test('ValidationError carries optional path/value context', () => {
    const err = new ValidationError('quantity must be greater than 0', {
      path: 'quantity',
      value: 0
    })
    expect(err.context?.path).toBe('quantity')
    expect(err.context?.value).toBe(0)
  })

  test('ModifierError carries optional path/value context', () => {
    const err = new ModifierError('drop', 'too many', {
      path: 'modifiers.drop',
      value: { lowest: 4 }
    })
    expect(err.context?.path).toBe('modifiers.drop')
    expect(err.context?.value).toEqual({ lowest: 4 })
  })

  test('NotationParseError always carries the notation in context', () => {
    const err = new NotationParseError('xyz', 'not valid')
    expect(err.context?.notation).toBe('xyz')
  })

  test('NotationParseError carries position when the parser knows it', () => {
    const err = new NotationParseError('1d6x5000', 'repeat too large', undefined, {
      position: 3,
      value: 5000
    })
    expect(err.context?.notation).toBe('1d6x5000')
    expect(err.context?.position).toBe(3)
    expect(err.context?.value).toBe(5000)
  })

  test('validateRollOptions surfaces the offending field via context', () => {
    try {
      roll({ sides: 6, quantity: -1 })
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      if (e instanceof ValidationError) {
        expect(e.context?.path).toBe('quantity')
        expect(e.context?.value).toBe(-1)
      }
    }
  })

  test('validateRollOptions surfaces the sides field via context', () => {
    try {
      roll({ sides: 0, quantity: 1 })
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      if (e instanceof ValidationError) {
        expect(e.context?.path).toBe('sides')
        expect(e.context?.value).toBe(0)
      }
    }
  })

  test('notation parser emits position for oversized repeat count', () => {
    try {
      roll('1d6x5000')
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(NotationParseError)
      if (e instanceof NotationParseError) {
        expect(e.context?.notation).toBe('1d6x5000')
        expect(typeof e.context?.position).toBe('number')
      }
    }
  })

  test('drop modifier surfaces path when the pool is too small', () => {
    try {
      roll({ sides: 6, quantity: 2, modifiers: { drop: { lowest: 2 } } })
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(ModifierError)
      if (e instanceof ModifierError) {
        expect(e.context?.path).toBe('modifiers.drop')
      }
    }
  })
})
