import type { DiceNotation } from '@randsum/core'
import { describe, expect, it } from 'bun:test'
import {
  completeRollPattern,
  coreNotationPattern,
  isDiceNotation
} from '@randsum/core'
import { notationToOptions } from '../src/utils/notationToOptions'
import { validateNotation } from '../src/validateNotation'

describe('Integration Tests', () => {
  describe('isDiceNotation and validateNotation consistency', () => {
    const testCases = [
      {
        input: '1d6',
        shouldBeValid: true,
        description: 'basic valid notation'
      },
      {
        input: '2d20+3',
        shouldBeValid: true,
        description: 'notation with modifier'
      },
      {
        input: '3d{abc}',
        shouldBeValid: true,
        description: 'custom dice notation'
      },
      {
        input: 'invalid',
        shouldBeValid: false,
        description: 'completely invalid'
      },
      { input: 'd6', shouldBeValid: false, description: 'missing quantity' },
      { input: '2d', shouldBeValid: false, description: 'missing sides' }
    ]

    testCases.forEach(({ input, shouldBeValid, description }) => {
      it(`${description}: isDiceNotation and validateNotation agree on "${input}"`, () => {
        const isDiceResult = isDiceNotation(input)
        const validateResult = validateNotation(input)

        expect(isDiceResult).toBe(shouldBeValid)
        expect(validateResult.valid).toBe(shouldBeValid)

        if (isDiceResult) {
          expect(validateResult.type).not.toBe('invalid')
        } else {
          expect(validateResult.type).toBe('invalid')
        }
      })
    })
  })

  describe('isDiceNotation and validateNotation divergence cases', () => {
    const divergentCases = [
      {
        input: '2d{abc}L',
        isDiceExpected: true,
        validateExpected: false,
        description: 'custom dice with modifiers'
      }
    ]

    divergentCases.forEach(
      ({ input, isDiceExpected, validateExpected, description }) => {
        it(`${description}: isDiceNotation and validateNotation diverge on "${input}"`, () => {
          const isDiceResult = isDiceNotation(input)
          const validateResult = validateNotation(input)

          expect(isDiceResult).toBe(isDiceExpected)
          expect(validateResult.valid).toBe(validateExpected)

          expect(isDiceResult).not.toBe(validateResult.valid)
        })
      }
    )
  })

  describe('pattern matching and function consistency', () => {
    const validNotations = [
      '1d6',
      '2d20',
      '3d8+2',
      '1d{abc}',
      '4d6L1',
      '2D10H2'
    ]

    validNotations.forEach((notation) => {
      it(`pattern matching aligns with isDiceNotation for: ${notation}`, () => {
        const isDiceResult = isDiceNotation(notation)
        const corePatternMatch = coreNotationPattern.test(notation)
        const cleanNotation = notation.replace(/\s/g, '')
        const completePatternMatch =
          cleanNotation.replace(completeRollPattern, '').length === 0

        if (isDiceResult) {
          expect(corePatternMatch).toBe(true)
          expect(completePatternMatch).toBe(true)
        }
      })
    })
  })

  interface NotationToOptionsTestCase {
    input: DiceNotation
    expectedQuantity: number
    expectedSides: number | string[]
  }

  describe('notationToOptions integration', () => {
    const validNotations: NotationToOptionsTestCase[] = [
      { input: '1d6', expectedQuantity: 1, expectedSides: 6 },
      { input: '2d20', expectedQuantity: 2, expectedSides: 20 },
      { input: '3d{abc}', expectedQuantity: 3, expectedSides: ['a', 'b', 'c'] },
      { input: '1D6', expectedQuantity: 1, expectedSides: 6 },
      { input: '2d{ht}', expectedQuantity: 2, expectedSides: ['h', 't'] }
    ]

    validNotations.forEach(({ input, expectedQuantity, expectedSides }) => {
      it(`notationToOptions correctly parses: ${input}`, () => {
        expect(isDiceNotation(input)).toBe(true)

        const options = notationToOptions(input)
        expect(options.quantity).toBe(expectedQuantity)
        expect(options.sides).toEqual(expectedSides)
      })
    })
  })

  describe('type definition alignment', () => {
    it('validateNotation returns correct types for numeric dice', () => {
      const result = validateNotation('2d6')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.type).toBe('numeric')
        expect(typeof result.digested.sides).toBe('number')
        expect(result.notation).toBe('2d6')
      }
    })

    it('validateNotation returns correct types for custom dice', () => {
      const result = validateNotation('2d{abc}')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.type).toBe('custom')
        expect(Array.isArray(result.digested.sides)).toBe(true)
        expect(result.notation).toBe('2d{abc}')
      }
    })

    it('validateNotation returns correct types for invalid notation', () => {
      const result = validateNotation('invalid')

      expect(result.valid).toBe(false)
      expect(result.type).toBe('invalid')
      expect(result.digested).toEqual({})
    })
  })

  describe('notation parsing pipeline', () => {
    const complexNotations: DiceNotation[] = [
      '2d6+3',
      '1d20L',
      '3d8H2',
      '4d6L1+2'
    ]

    complexNotations.forEach((notation) => {
      it(`complete pipeline works for: ${notation}`, () => {
        const isValid = isDiceNotation(notation)
        expect(isValid).toBe(true)

        const validation = validateNotation(notation)
        expect(validation.valid).toBe(true)

        const options = notationToOptions(notation)
        expect(options.quantity).toBeGreaterThan(0)
        expect(options.sides).toBeDefined()

        if (validation.valid) {
          expect(validation.digested).toEqual(options)
        }
      })
    })
  })

  describe('error handling consistency', () => {
    const invalidInputs = [null, undefined, 123, '', 'not-dice', 'd6', '2d']

    invalidInputs.forEach((input) => {
      it(`handles invalid input consistently: ${JSON.stringify(input)}`, () => {
        const isDiceResult = isDiceNotation(input)
        const validateResult = validateNotation(String(input))

        expect(isDiceResult).toBe(false)
        expect(validateResult.valid).toBe(false)
        expect(validateResult.type).toBe('invalid')
      })
    })
  })

  describe('performance characteristics', () => {
    it('all functions perform well with repeated calls', () => {
      const notation = '2d6+3'
      const iterations = 1000

      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        isDiceNotation(notation)
        validateNotation(notation)
        notationToOptions(notation)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(1000)
    })

    it('handles large notation strings efficiently', () => {
      const largeNotation = '999999d999999+999999'

      const startTime = performance.now()

      const isDiceResult = isDiceNotation(largeNotation)
      const validateResult = validateNotation(largeNotation)

      const endTime = performance.now()

      expect(isDiceResult).toBe(true)
      expect(validateResult.valid).toBe(true)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})
