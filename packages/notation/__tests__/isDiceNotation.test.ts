import { describe, expect, it } from 'bun:test'
import { isDiceNotation } from '../src/isDiceNotation'

describe(isDiceNotation, () => {
  describe('basic valid dice notations', () => {
    const validBasicNotations = [
      '1d6',
      '2d20',
      '3d8',
      '1d4',
      '10d10',
      '100d100'
    ]

    validBasicNotations.forEach((notation) => {
      it(`returns true for valid basic notation: ${notation}`, () => {
        expect(isDiceNotation(notation)).toBe(true)
      })
    })
  })

  describe('valid complex notations with modifiers', () => {
    const validComplexNotations = [
      '2d6+3',
      '1d20L',
      '3d6H2',
      '2d6-1',
      '1d20+5',
      '4d6L1',
      '3d8H1',
      '2d10+2',
      '1d12-3'
    ]

    validComplexNotations.forEach((notation) => {
      it(`returns true for valid complex notation: ${notation}`, () => {
        expect(isDiceNotation(notation)).toBe(true)
      })
    })
  })

  describe('valid custom dice notations', () => {
    const validCustomNotations = [
      '2d{abc}',
      '1d{ht}',
      '3d{123}',
      '1d{heads,tails}',
      '2d{red,blue,green}',
      '1d{!@#$%}',
      '2d{αβγ}'
    ]

    validCustomNotations.forEach((notation) => {
      it(`returns true for valid custom notation: ${notation}`, () => {
        expect(isDiceNotation(notation)).toBe(true)
      })
    })
  })

  describe('custom dice with modifiers (pattern-valid but business-invalid)', () => {
    const customDiceWithModifiers = [
      '2d{abc}L',
      '1d{ht}H',
      '3d{123}+2',
      '2d{ab}-1'
    ]

    customDiceWithModifiers.forEach((notation) => {
      it(`returns true for pattern-valid custom dice with modifiers: ${notation}`, () => {
        // Note: isDiceNotation only checks pattern matching, not business rules
        // validateNotation will reject these due to business logic
        expect(isDiceNotation(notation)).toBe(true)
      })
    })
  })

  describe('case sensitivity handling', () => {
    const caseVariations = [
      { input: '1D6', expected: true, description: 'uppercase D' },
      { input: '2d20', expected: true, description: 'lowercase d' },
      {
        input: '3D8',
        expected: true,
        description: 'uppercase D with different numbers'
      },
      {
        input: '1d{ABC}',
        expected: true,
        description: 'custom dice with uppercase content'
      }
    ]

    caseVariations.forEach(({ input, expected, description }) => {
      it(`handles ${description}: ${input}`, () => {
        expect(isDiceNotation(input)).toBe(expected)
      })
    })
  })

  describe('whitespace handling', () => {
    const whitespaceVariations = [
      {
        input: ' 1d6 ',
        expected: false,
        description: 'leading and trailing spaces (fails core pattern)'
      },
      {
        input: '1 d 6',
        expected: false,
        description: 'spaces around d (breaks pattern)'
      },
      {
        input: '2d6 + 3',
        expected: true,
        description: 'spaces around modifier (core pattern matches)'
      },
      {
        input: '\t1d6\n',
        expected: false,
        description: 'tabs and newlines (fails core pattern)'
      },
      {
        input: '  2d{abc}  ',
        expected: false,
        description: 'spaces with custom dice (fails core pattern)'
      }
    ]

    whitespaceVariations.forEach(({ input, expected, description }) => {
      it(`handles ${description}: "${input}"`, () => {
        expect(isDiceNotation(input)).toBe(expected)
      })
    })
  })

  describe('invalid string inputs', () => {
    const invalidStrings = [
      'not-dice',
      'abc123',
      'random text',
      '123',
      'dice',
      'roll',
      '1x6',
      '2*6',
      '1/6',
      'hello world'
    ]

    invalidStrings.forEach((input) => {
      it(`returns false for invalid string: "${input}"`, () => {
        expect(isDiceNotation(input)).toBe(false)
      })
    })
  })

  describe('malformed dice notations', () => {
    const malformedNotations = [
      'd6', // missing quantity
      '2d', // missing sides
      '2x6', // wrong separator
      'dd6', // double d
      '2d6d', // extra d
      '2d6+', // incomplete modifier
      '2d6++3', // double modifier
      '2d{', // incomplete custom dice
      '2d}', // malformed custom dice
      '2d{abc', // unclosed custom dice
      '2dabc}', // malformed custom dice
      '' // empty string
    ]

    malformedNotations.forEach((input) => {
      it(`returns false for malformed notation: "${input}"`, () => {
        expect(isDiceNotation(input)).toBe(false)
      })
    })
  })

  describe('non-string inputs', () => {
    const nonStringInputs = [
      { input: null, description: 'null' },
      { input: undefined, description: 'undefined' },
      { input: 123, description: 'number' },
      { input: true, description: 'boolean true' },
      { input: false, description: 'boolean false' },
      { input: [], description: 'empty array' },
      { input: {}, description: 'empty object' },
      { input: { dice: '1d6' }, description: 'object with dice property' }
    ]

    nonStringInputs.forEach(({ input, description }) => {
      it(`returns false for ${description}`, () => {
        expect(isDiceNotation(input)).toBe(false)
      })
    })
  })

  describe('edge cases and boundary conditions', () => {
    const edgeCases = [
      {
        input: '0d6',
        expected: true,
        description: 'zero quantity (valid pattern)'
      },
      {
        input: '1d0',
        expected: true,
        description: 'zero sides (valid pattern)'
      },
      { input: '-1d6', expected: false, description: 'negative quantity' },
      { input: '1d-6', expected: false, description: 'negative sides' },
      { input: '1.5d6', expected: false, description: 'decimal quantity' },
      { input: '1d6.5', expected: false, description: 'decimal sides' },
      {
        input: '999999d999999',
        expected: true,
        description: 'very large numbers'
      },
      {
        input: '1d{}',
        expected: true,
        description: 'empty custom dice (valid pattern)'
      },
      { input: '1d{ }', expected: true, description: 'custom dice with space' }
    ]

    edgeCases.forEach(({ input, expected, description }) => {
      it(`handles ${description}: "${input}"`, () => {
        expect(isDiceNotation(input)).toBe(expected)
      })
    })
  })
})
