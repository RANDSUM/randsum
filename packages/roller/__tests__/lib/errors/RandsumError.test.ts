import { describe, expect, test } from 'bun:test'
import {
  type ErrorContext,
  RandsumError,
  type RandsumErrorCode
} from '../../../src/lib'
import { createErrorContext } from '../../support/fixtures'

describe('RandsumError', () => {
  describe('constructor', () => {
    test('creates error with minimal parameters', () => {
      const error = new RandsumError('Test error', 'VALIDATION_ERROR')

      expect(error instanceof Error).toBe(true)
      expect(error instanceof RandsumError).toBe(true)
      expect(error.name).toBe('RandsumError')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Test error')
      expect(error.context).toEqual({})
      expect(error.suggestions).toEqual([])
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    test('creates error with full parameters', () => {
      const context = createErrorContext({
        input: '4d6x',
        expected: 'Valid notation',
        location: 'test location',
        details: { custom: 'data' }
      })
      const suggestions = ['Try this', 'Or that']
      const error = new RandsumError(
        'Full error',
        'INVALID_NOTATION',
        context,
        suggestions
      )

      expect(error.message).toBe('Full error')
      expect(error.code).toBe('INVALID_NOTATION')
      expect(error.context).toEqual(context)
      expect(error.suggestions).toEqual(suggestions)
    })

    test('maintains proper prototype chain', () => {
      const error = new RandsumError('Test', 'VALIDATION_ERROR')

      expect(error instanceof Error).toBe(true)
      expect(error instanceof RandsumError).toBe(true)
      expect(error.name).toBe('RandsumError')
    })
  })

  describe('toString method', () => {
    test('formats basic error without context', () => {
      const error = new RandsumError('Basic error', 'VALIDATION_ERROR')
      const result = error.toString()

      expect(result).toBe('RandsumError [VALIDATION_ERROR]: Basic error')
    })

    test('includes input when provided', () => {
      const error = new RandsumError(
        'Error with input',
        'INVALID_NOTATION',
        createErrorContext({
          input: '4d6x'
        })
      )
      const result = error.toString()

      expect(result).toContain(
        'RandsumError [INVALID_NOTATION]: Error with input'
      )
      expect(result).toContain('Input: "4d6x"')
    })

    test('includes expected when provided', () => {
      const error = new RandsumError(
        'Error with expected',
        'VALIDATION_ERROR',
        createErrorContext({
          expected: 'Valid format'
        })
      )
      const result = error.toString()

      expect(result).toContain('Expected: Valid format')
    })

    test('includes location when provided', () => {
      const error = new RandsumError(
        'Error with location',
        'VALIDATION_ERROR',
        createErrorContext({
          location: 'dice parsing'
        })
      )
      const result = error.toString()

      expect(result).toContain('Location: dice parsing')
    })

    test('includes suggestions when provided', () => {
      const error = new RandsumError(
        'Error with suggestions',
        'VALIDATION_ERROR',
        {},
        ['First suggestion', 'Second suggestion']
      )
      const result = error.toString()

      expect(result).toContain('Suggestions:')
      expect(result).toContain('• First suggestion')
      expect(result).toContain('• Second suggestion')
    })

    test('formats complete error with all fields', () => {
      const error = new RandsumError(
        'Complete error',
        'INVALID_NOTATION',
        createErrorContext({
          input: '4d6x',
          expected: 'Valid notation',
          location: 'notation parsing'
        }),
        ['Use 4d6E instead', 'Check documentation']
      )
      const result = error.toString()

      expect(result).toContain(
        'RandsumError [INVALID_NOTATION]: Complete error'
      )
      expect(result).toContain('Input: "4d6x"')
      expect(result).toContain('Expected: Valid notation')
      expect(result).toContain('Location: notation parsing')
      expect(result).toContain('Suggestions:')
      expect(result).toContain('• Use 4d6E instead')
      expect(result).toContain('• Check documentation')
    })

    test('handles undefined input correctly', () => {
      const error = new RandsumError(
        'Test',
        'VALIDATION_ERROR',
        createErrorContext({
          input: undefined,
          expected: 'Something'
        })
      )
      const result = error.toString()

      expect(result).not.toContain('Input:')
      expect(result).toContain('Expected: Something')
    })

    test('handles complex input objects', () => {
      const complexInput = { notation: '4d6', modifiers: ['H', 'L'] }
      const error = new RandsumError(
        'Complex input',
        'VALIDATION_ERROR',
        createErrorContext({
          input: complexInput
        })
      )
      const result = error.toString()

      expect(result).toContain(
        'Input: {"notation":"4d6","modifiers":["H","L"]}'
      )
    })
  })

  describe('toJSON method', () => {
    test('serializes basic error', () => {
      const error = new RandsumError('JSON test', 'VALIDATION_ERROR')
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'RandsumError',
        message: 'JSON test',
        code: 'VALIDATION_ERROR',
        context: {},
        suggestions: [],
        timestamp: error.timestamp.toISOString(),
        stack: error.stack
      })
    })

    test('serializes complete error', () => {
      const context = createErrorContext({
        input: '4d6x',
        expected: 'Valid notation',
        location: 'parsing',
        details: { custom: 'data' }
      })
      const suggestions = ['Fix this', 'Try that']
      const error = new RandsumError(
        'Complete JSON',
        'INVALID_NOTATION',
        context,
        suggestions
      )
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'RandsumError',
        message: 'Complete JSON',
        code: 'INVALID_NOTATION',
        context,
        suggestions,
        timestamp: error.timestamp.toISOString(),
        stack: error.stack
      })
    })

    interface SerializedRandsumError {
      name: string
      message?: string
      code?: RandsumErrorCode
      context?: ErrorContext
      suggestions?: string[]
      timestamp?: string
      stack?: string
    }

    test('includes stack trace', () => {
      const error = new RandsumError('Stack test', 'VALIDATION_ERROR')
      const json = error.toJSON() as SerializedRandsumError

      expect(json).toHaveProperty('stack')
      expect(typeof json.stack).toBe('string')
    })

    test('serializes timestamp as ISO string', () => {
      const error = new RandsumError('Timestamp test', 'VALIDATION_ERROR')
      const json = error.toJSON() as SerializedRandsumError
      expect(typeof json.timestamp).toBe('string')
    })
  })

  describe('fromError static method', () => {
    test('converts standard Error to RandsumError', () => {
      const originalError = new Error('Original message')
      const randsumError = RandsumError.fromError(
        originalError,
        'VALIDATION_ERROR'
      )

      expect(randsumError instanceof RandsumError).toBe(true)
      expect(randsumError.message).toBe('Original message')
      expect(randsumError.code).toBe('VALIDATION_ERROR')
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(randsumError.stack).toEqual(originalError.stack!)
    })

    test('preserves original stack trace', () => {
      const originalError = new Error('Stack test')
      const originalStack = originalError.stack
      const randsumError = RandsumError.fromError(
        originalError,
        'VALIDATION_ERROR'
      )

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(randsumError.stack).toBe(originalStack!)
    })

    test('accepts context and suggestions', () => {
      const originalError = new Error('Context test')
      const context = createErrorContext({
        input: 'test',
        location: 'conversion'
      })
      const suggestions = ['Suggestion 1', 'Suggestion 2']
      const randsumError = RandsumError.fromError(
        originalError,
        'INVALID_NOTATION',
        context,
        suggestions
      )

      expect(randsumError.context).toEqual(context)
      expect(randsumError.suggestions).toEqual(suggestions)
      expect(randsumError.code).toBe('INVALID_NOTATION')
    })

    test('uses default empty context and suggestions', () => {
      const originalError = new Error('Default test')
      const randsumError = RandsumError.fromError(
        originalError,
        'VALIDATION_ERROR'
      )

      expect(randsumError.context).toEqual({})
      expect(randsumError.suggestions).toEqual([])
    })

    test('handles TypeError conversion', () => {
      const typeError = new TypeError('Type error message')
      const randsumError = RandsumError.fromError(
        typeError,
        'INVALID_DIE_CONFIG'
      )

      expect(randsumError.message).toBe('Type error message')
      expect(randsumError.code).toBe('INVALID_DIE_CONFIG')
      expect(randsumError instanceof RandsumError).toBe(true)
    })

    test('handles ReferenceError conversion', () => {
      const refError = new ReferenceError('Reference error')
      const randsumError = RandsumError.fromError(refError, 'ROLL_CONSTRAINT')

      expect(randsumError.message).toBe('Reference error')
      expect(randsumError.code).toBe('ROLL_CONSTRAINT')
    })
  })

  describe('error codes', () => {
    test('supports all defined error codes', () => {
      const codes = [
        'INVALID_NOTATION',
        'MODIFIER_CONFLICT',
        'ROLL_CONSTRAINT',
        'INVALID_DIE_CONFIG',
        'INVALID_MODIFIER_OPTIONS',
        'VALIDATION_ERROR'
      ] as const

      codes.forEach((code) => {
        const error = new RandsumError(`Test ${code}`, code)
        expect(error.code).toBe(code)
      })
    })
  })

  describe('edge cases', () => {
    test('handles empty message', () => {
      const error = new RandsumError('', 'VALIDATION_ERROR')

      expect(error.message).toBe('')
      expect(error.toString()).toContain('RandsumError [VALIDATION_ERROR]: ')
    })

    test('handles very long messages', () => {
      const longMessage = 'A'.repeat(10000)
      const error = new RandsumError(longMessage, 'VALIDATION_ERROR')

      expect(error.message).toBe(longMessage)
      expect(error.toString()).toContain(longMessage)
    })

    test('handles undefined values in context', () => {
      const errorWithUndefined = new RandsumError(
        'Undefined test',
        'VALIDATION_ERROR',
        createErrorContext({
          input: undefined,
          expected: undefined,
          location: 'test'
        })
      )
      const resultWithUndefined = errorWithUndefined.toString()

      expect(resultWithUndefined).not.toContain('Input:')
      expect(resultWithUndefined).not.toContain('Expected:')
      expect(resultWithUndefined).toContain('Location: test')
    })

    test('handles object input in context', () => {
      const objectInput = { notation: '4d6', invalid: true }
      const error = new RandsumError(
        'Object test',
        'VALIDATION_ERROR',
        createErrorContext({
          input: objectInput,
          location: 'test'
        })
      )
      const result = error.toString()

      expect(result).toContain('Input: {"notation":"4d6","invalid":true}')
      expect(result).toContain('Location: test')
    })

    test('handles empty suggestions array', () => {
      const error = new RandsumError(
        'Empty suggestions',
        'VALIDATION_ERROR',
        {},
        []
      )
      const result = error.toString()

      expect(result).not.toContain('Suggestions:')
    })

    test('handles very long suggestion text', () => {
      const longSuggestion =
        'This is a very long suggestion that goes on and on and on '.repeat(10)
      const error = new RandsumError(
        'Long suggestion',
        'VALIDATION_ERROR',
        {},
        [longSuggestion]
      )
      const result = error.toString()

      expect(result).toContain(longSuggestion)
    })
  })
})
