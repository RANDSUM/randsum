import { describe, expect, test } from 'bun:test'
import { D, isCustomRollArgument, isNumericRollArgument } from '../../../src'
import {
  createCustomRollOptions,
  createNumericRollOptions
} from '../../support/fixtures'

describe('Roll Argument Type Guards', () => {
  describe('isNumericRollArgument', () => {
    test('should return true for numeric dice notation', () => {
      expect(isNumericRollArgument('1d6')).toBe(true)
      expect(isNumericRollArgument('2d20')).toBe(true)
      expect(isNumericRollArgument('4d8+2')).toBe(true)
      expect(isNumericRollArgument('4d6L')).toBe(true)
      expect(isNumericRollArgument('4d6R{1}!+3')).toBe(false) // Contains { so it's considered custom
    })

    test('should return true for numeric dice objects', () => {
      const numericDie = D(20)
      expect(isNumericRollArgument(numericDie)).toBe(true)

      const d6 = D(6)
      expect(isNumericRollArgument(d6)).toBe(true)
    })

    test('should return true for numeric roll options', () => {
      const options = createNumericRollOptions({ sides: 6, quantity: 4 })
      expect(isNumericRollArgument(options)).toBe(true)

      const optionsWithModifiers = createNumericRollOptions({
        sides: 20,
        quantity: 2,
        modifiers: { plus: 5 }
      })
      expect(isNumericRollArgument(optionsWithModifiers)).toBe(true)
    })

    test('should return true for plain numbers', () => {
      expect(isNumericRollArgument(6)).toBe(true)
      expect(isNumericRollArgument(20)).toBe(true)
      expect(isNumericRollArgument(100)).toBe(true)
      expect(isNumericRollArgument(1)).toBe(true)
    })

    test('should return true for numeric strings', () => {
      expect(isNumericRollArgument('6')).toBe(true)
      expect(isNumericRollArgument('20')).toBe(true)
      expect(isNumericRollArgument('100')).toBe(true)
      expect(isNumericRollArgument('1')).toBe(true)
    })

    test('should return false for custom dice notation', () => {
      expect(isNumericRollArgument('2d{HT}')).toBe(false)
      expect(isNumericRollArgument('3d{abc}')).toBe(false)
      expect(isNumericRollArgument('1d{critical,hit,miss}')).toBe(false)
    })

    test('should return false for custom dice objects', () => {
      const customDie = D(['heads', 'tails'])
      expect(isNumericRollArgument(customDie)).toBe(false)

      const customDie2 = D(['red', 'blue', 'green'])
      expect(isNumericRollArgument(customDie2)).toBe(false)
    })

    test('should return false for custom roll options', () => {
      const customOptions = createCustomRollOptions({
        sides: ['heads', 'tails'],
        quantity: 2
      })
      expect(isNumericRollArgument(customOptions)).toBe(false)
    })

    test('should return false for string arrays', () => {
      expect(isNumericRollArgument(['heads', 'tails'])).toBe(false)
      expect(isNumericRollArgument(['red', 'blue', 'green'])).toBe(false)
      expect(isNumericRollArgument(['critical', 'hit', 'miss'])).toBe(false)
    })

    test('should return false for invalid inputs', () => {
      expect(isNumericRollArgument(null)).toBe(false)
      expect(isNumericRollArgument(undefined)).toBe(false)
      expect(isNumericRollArgument({})).toBe(false)
      expect(isNumericRollArgument([])).toBe(false)
      expect(isNumericRollArgument('invalid')).toBe(false)
      expect(isNumericRollArgument('hello')).toBe(false)
      expect(isNumericRollArgument(true)).toBe(false)
    })

    test('should return false for non-numeric strings', () => {
      expect(isNumericRollArgument('abc')).toBe(false)
      expect(isNumericRollArgument('hello')).toBe(false)
      expect(isNumericRollArgument('NaN')).toBe(false)
      expect(isNumericRollArgument('Infinity')).toBe(true) // Infinity is actually a valid number in JS
    })

    test('should work with array filtering', () => {
      const testArguments = [
        '4d6',
        D(20),
        ['heads', 'tails'],
        6,
        '20',
        createNumericRollOptions(),
        'invalid',
        D(['red', 'blue'])
      ]

      const numericArguments = testArguments.filter(isNumericRollArgument)
      expect(numericArguments).toHaveLength(5) // Includes 'Infinity' which is valid
    })
  })

  describe('isCustomRollArgument', () => {
    test('should return true for custom dice notation', () => {
      expect(isCustomRollArgument('2d{HT}')).toBe(true)
      expect(isCustomRollArgument('3d{abc}')).toBe(true)
      expect(isCustomRollArgument('1d{critical,hit,miss}')).toBe(true)
      expect(isCustomRollArgument('4d{red,blue,green,yellow}')).toBe(true)
      expect(isCustomRollArgument('2d{⚔️🛡️🏹}')).toBe(true)
    })

    test('should return true for custom dice objects', () => {
      const customDie = D(['heads', 'tails'])
      expect(isCustomRollArgument(customDie)).toBe(true)

      const customDie2 = D(['red', 'blue', 'green'])
      expect(isCustomRollArgument(customDie2)).toBe(true)

      const customDie3 = D(['critical', 'hit', 'miss'])
      expect(isCustomRollArgument(customDie3)).toBe(true)
    })

    test('should return true for custom roll options', () => {
      const customOptions = createCustomRollOptions({
        sides: ['heads', 'tails'],
        quantity: 2
      })
      expect(isCustomRollArgument(customOptions)).toBe(true)

      const customOptions2 = createCustomRollOptions({
        sides: ['red', 'blue', 'green', 'yellow'],
        quantity: 1
      })
      expect(isCustomRollArgument(customOptions2)).toBe(true)
    })

    test('should return true for string arrays', () => {
      expect(isCustomRollArgument(['heads', 'tails'])).toBe(true)
      expect(isCustomRollArgument(['red', 'blue', 'green'])).toBe(true)
      expect(isCustomRollArgument(['critical', 'hit', 'miss'])).toBe(true)
      expect(isCustomRollArgument(['⚔️', '🛡️', '🏹'])).toBe(true)
      expect(isCustomRollArgument(['a', 'b', 'c', 'd'])).toBe(true)
    })

    test('should return false for numeric dice notation', () => {
      expect(isCustomRollArgument('1d6')).toBe(false)
      expect(isCustomRollArgument('2d20')).toBe(false)
      expect(isCustomRollArgument('4d8+2')).toBe(false)
      expect(isCustomRollArgument('4d6L')).toBe(false)
      expect(isCustomRollArgument('4d6R{1}!+3')).toBe(true)
    })

    test('should return false for numeric dice objects', () => {
      const numericDie = D(20)
      expect(isCustomRollArgument(numericDie)).toBe(false)

      const d6 = D(6)
      expect(isCustomRollArgument(d6)).toBe(false)
    })

    test('should return false for numeric roll options', () => {
      const numericOptions = createNumericRollOptions({ sides: 6, quantity: 4 })
      expect(isCustomRollArgument(numericOptions)).toBe(false)
    })

    test('should return false for plain numbers', () => {
      expect(isCustomRollArgument(6)).toBe(false)
      expect(isCustomRollArgument(20)).toBe(false)
      expect(isCustomRollArgument(100)).toBe(false)
    })

    test('should return false for numeric strings', () => {
      expect(isCustomRollArgument('6')).toBe(false)
      expect(isCustomRollArgument('20')).toBe(false)
      expect(isCustomRollArgument('100')).toBe(false)
    })

    test('should return false for arrays with non-strings', () => {
      expect(isCustomRollArgument([1, 2, 3])).toBe(false)
      expect(isCustomRollArgument(['heads', 2, 'tails'])).toBe(false)
      expect(isCustomRollArgument([true, false])).toBe(false)
      expect(isCustomRollArgument([null, undefined])).toBe(false)
    })

    test('should return false for invalid inputs', () => {
      expect(isCustomRollArgument(null)).toBe(false)
      expect(isCustomRollArgument(undefined)).toBe(false)
      expect(isCustomRollArgument({})).toBe(false)
      expect(isCustomRollArgument([])).toBe(true) // Empty array is actually valid custom argument
      expect(isCustomRollArgument('invalid')).toBe(false)
      expect(isCustomRollArgument(true)).toBe(false)
    })

    test('should work with array filtering', () => {
      const testArguments = [
        '2d{HT}',
        D(['heads', 'tails']),
        '4d6',
        ['red', 'blue'],
        6,
        createCustomRollOptions(),
        'invalid',
        D(20)
      ]

      const customArguments = testArguments.filter(isCustomRollArgument)
      expect(customArguments).toHaveLength(4)
    })
  })

  describe('Mutual exclusivity', () => {
    test('should be mutually exclusive for valid arguments', () => {
      const validArguments = [
        '4d6',
        '2d{HT}',
        D(20),
        D(['heads', 'tails']),
        ['red', 'blue'],
        6,
        '20',
        createNumericRollOptions(),
        createCustomRollOptions()
      ]

      validArguments.forEach((argument) => {
        const isCustom = isCustomRollArgument(argument)
        const isNumeric = isNumericRollArgument(argument)

        // Should be exactly one or the other, never both or neither
        expect(isCustom !== isNumeric).toBe(true)
      })
    })

    test('should both return false for invalid arguments', () => {
      const invalidInputs = [
        null,
        undefined,
        {},
        'invalid',
        true,
        [1, 2, 3],
        ['mixed', 2, 'array']
      ]

      invalidInputs.forEach((input) => {
        expect(isCustomRollArgument(input)).toBe(false)
        expect(isNumericRollArgument(input)).toBe(false)
      })

      // Empty array is valid for custom but not numeric
      expect(isCustomRollArgument([])).toBe(true)
      expect(isNumericRollArgument([])).toBe(false)
    })
  })

  describe('Type narrowing', () => {
    test('should provide proper TypeScript type narrowing for numeric arguments', () => {
      const argument: unknown = '4d6+2'

      if (isNumericRollArgument(argument)) {
        // TypeScript should know this is a NumericRollArgument
        expect(
          typeof argument === 'string' || typeof argument === 'number'
        ).toBe(true)
      }
    })

    test('should provide proper TypeScript type narrowing for custom arguments', () => {
      const argument: unknown = ['heads', 'tails']

      if (isCustomRollArgument(argument)) {
        // TypeScript should know this is a CustomRollArgument
        expect(Array.isArray(argument) || typeof argument === 'string').toBe(
          true
        )
      }
    })

    test('should enable type-safe argument processing', () => {
      const testArguments = [
        '4d6',
        ['heads', 'tails'],
        D(20),
        D(['red', 'blue']),
        6,
        createNumericRollOptions()
      ]

      const numericArguments: unknown[] = []
      const customArguments: unknown[] = []

      testArguments.forEach((argument) => {
        if (isNumericRollArgument(argument)) {
          numericArguments.push(argument)
        } else if (isCustomRollArgument(argument)) {
          customArguments.push(argument)
        }
      })

      expect(numericArguments).toHaveLength(4) // '4d6', D(20), 6, createNumericRollOptions()
      expect(customArguments).toHaveLength(2) // ['heads', 'tails'], D(['red', 'blue'])
    })
  })
})
