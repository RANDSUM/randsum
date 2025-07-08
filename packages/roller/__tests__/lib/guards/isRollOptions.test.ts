import { describe, expect, test } from 'bun:test'
import { D, isCustomRollOptions, isNumericRollOptions } from '../../../src'
import {
  createCustomRollOptions,
  createNumericRollOptions
} from '../../support/fixtures'

describe('Roll Options Type Guards', () => {
  describe('isNumericRollOptions', () => {
    test('should return true for numeric roll options', () => {
      const options = createNumericRollOptions({ sides: 6, quantity: 4 })
      expect(isNumericRollOptions(options)).toBe(true)

      if (isNumericRollOptions(options)) {
        expect(typeof options.sides).toBe('number')
        expect(options.sides).toBe(6)
        expect(options.quantity).toBe(4)
      }
    })

    test('should return true for numeric options with modifiers', () => {
      const optionsWithModifiers = createNumericRollOptions({
        sides: 20,
        quantity: 2,
        modifiers: { plus: 5, drop: { lowest: 1 } }
      })
      expect(isNumericRollOptions(optionsWithModifiers)).toBe(true)

      if (isNumericRollOptions(optionsWithModifiers)) {
        expect(typeof optionsWithModifiers.sides).toBe('number')
        expect(optionsWithModifiers.modifiers?.plus).toBe(5)
      }
    })

    test('should return true for minimal numeric options', () => {
      const minimalOptions = { sides: 8 }
      expect(isNumericRollOptions(minimalOptions)).toBe(true)

      if (isNumericRollOptions(minimalOptions)) {
        expect(typeof minimalOptions.sides).toBe('number')
        expect(minimalOptions.sides).toBe(8)
      }
    })

    test('should return true for numeric options with various sides', () => {
      const d4Options = createNumericRollOptions({ sides: 4 })
      const d6Options = createNumericRollOptions({ sides: 6 })
      const d20Options = createNumericRollOptions({ sides: 20 })
      const d100Options = createNumericRollOptions({ sides: 100 })

      expect(isNumericRollOptions(d4Options)).toBe(true)
      expect(isNumericRollOptions(d6Options)).toBe(true)
      expect(isNumericRollOptions(d20Options)).toBe(true)
      expect(isNumericRollOptions(d100Options)).toBe(true)
    })

    test('should return false for custom roll options', () => {
      const customOptions = createCustomRollOptions({
        sides: ['heads', 'tails'],
        quantity: 2
      })
      expect(isNumericRollOptions(customOptions)).toBe(false)
    })

    test('should return false for die objects', () => {
      const numericDie = D(20)
      const customDie = D(['heads', 'tails'])

      expect(isNumericRollOptions(numericDie)).toBe(false)
      expect(isNumericRollOptions(customDie)).toBe(false)
    })

    test('should return false for invalid inputs', () => {
      expect(isNumericRollOptions(null)).toBe(false)
      expect(isNumericRollOptions(undefined)).toBe(false)
      expect(isNumericRollOptions({})).toBe(false)
      expect(isNumericRollOptions([])).toBe(false)
      expect(isNumericRollOptions('4d6')).toBe(false)
      expect(isNumericRollOptions(20)).toBe(false)
      expect(isNumericRollOptions(true)).toBe(false)
    })

    test('should return false for objects with array sides', () => {
      const arrayOptions = { sides: ['heads', 'tails'], quantity: 1 }
      expect(isNumericRollOptions(arrayOptions)).toBe(false)
    })

    test('should return false for objects missing sides', () => {
      const noSides = { quantity: 4 }
      expect(isNumericRollOptions(noSides)).toBe(false)
    })

    test('should work with array filtering', () => {
      const options = [
        createNumericRollOptions({ sides: 6 }),
        createCustomRollOptions({ sides: ['heads', 'tails'] }),
        { sides: 20, quantity: 1 },
        D(6),
        '4d6',
        null
      ]

      const numericOptions = options.filter(isNumericRollOptions)
      expect(numericOptions).toHaveLength(2)

      numericOptions.forEach((option) => {
        expect(typeof option.sides).toBe('number')
      })
    })
  })

  describe('isCustomRollOptions', () => {
    test('should return true for custom roll options', () => {
      const options = createCustomRollOptions({
        sides: ['heads', 'tails'],
        quantity: 2
      })
      expect(isCustomRollOptions(options)).toBe(true)

      if (isCustomRollOptions(options)) {
        expect(Array.isArray(options.sides)).toBe(true)
        expect(options.sides).toEqual(['heads', 'tails'])
        expect(options.quantity).toBe(2)
      }
    })

    test('should return true for various custom face options', () => {
      const coinOptions = createCustomRollOptions({
        sides: ['heads', 'tails']
      })
      const colorOptions = createCustomRollOptions({
        sides: ['red', 'blue', 'green', 'yellow']
      })
      const actionOptions = createCustomRollOptions({
        sides: ['critical', 'hit', 'miss']
      })

      expect(isCustomRollOptions(coinOptions)).toBe(true)
      expect(isCustomRollOptions(colorOptions)).toBe(true)
      expect(isCustomRollOptions(actionOptions)).toBe(true)
    })

    test('should return true for minimal custom options', () => {
      const minimalOptions = { sides: ['a', 'b'] }
      expect(isCustomRollOptions(minimalOptions)).toBe(true)

      if (isCustomRollOptions(minimalOptions)) {
        expect(Array.isArray(minimalOptions.sides)).toBe(true)
        expect(minimalOptions.sides.length).toBe(2)
      }
    })

    test('should return true for custom options with emoji faces', () => {
      const emojiOptions = createCustomRollOptions({
        sides: ['⚔️', '🛡️', '🏹', '🔥']
      })
      expect(isCustomRollOptions(emojiOptions)).toBe(true)

      if (isCustomRollOptions(emojiOptions)) {
        expect(
          emojiOptions.sides.every((face) => typeof face === 'string')
        ).toBe(true)
      }
    })

    test('should return false for numeric roll options', () => {
      const numericOptions = createNumericRollOptions({
        sides: 6,
        quantity: 4
      })
      expect(isCustomRollOptions(numericOptions)).toBe(false)
    })

    test('should return false for die objects', () => {
      const numericDie = D(20)
      const customDie = D(['heads', 'tails'])

      expect(isCustomRollOptions(numericDie)).toBe(false)
      expect(isCustomRollOptions(customDie)).toBe(false)
    })

    test('should return false for invalid inputs', () => {
      expect(isCustomRollOptions(null)).toBe(false)
      expect(isCustomRollOptions(undefined)).toBe(false)
      expect(isCustomRollOptions({})).toBe(false)
      expect(isCustomRollOptions([])).toBe(false)
      expect(isCustomRollOptions('2d{HT}')).toBe(false)
      expect(isCustomRollOptions(['heads', 'tails'])).toBe(false)
      expect(isCustomRollOptions(true)).toBe(false)
    })

    test('should return false for objects with numeric sides', () => {
      const numericOptions = { sides: 6, quantity: 1 }
      expect(isCustomRollOptions(numericOptions)).toBe(false)
    })

    test('should return false for objects missing sides', () => {
      const noSides = { quantity: 2 }
      expect(isCustomRollOptions(noSides)).toBe(false)
    })

    test('should work with array filtering', () => {
      const options = [
        createCustomRollOptions({ sides: ['heads', 'tails'] }),
        createNumericRollOptions({ sides: 6 }),
        { sides: ['red', 'blue'], quantity: 1 },
        D(['a', 'b']),
        '2d{HT}',
        null
      ]

      const customOptions = options.filter(isCustomRollOptions)
      expect(customOptions).toHaveLength(2)

      customOptions.forEach((option) => {
        expect(Array.isArray(option.sides)).toBe(true)
        expect(option.sides.every((face) => typeof face === 'string')).toBe(
          true
        )
      })
    })
  })

  describe('Mutual exclusivity', () => {
    test('should be mutually exclusive for valid options', () => {
      const validOptions = [
        createNumericRollOptions({ sides: 6 }),
        createCustomRollOptions({ sides: ['heads', 'tails'] }),
        { sides: 20, quantity: 1 },
        { sides: ['red', 'blue'], quantity: 2 },
        { sides: 8 },
        { sides: ['a', 'b', 'c'] }
      ]

      validOptions.forEach((option) => {
        const isCustom = isCustomRollOptions(option)
        const isNumeric = isNumericRollOptions(option)

        // Should be exactly one or the other, never both or neither
        expect(isCustom !== isNumeric).toBe(true)
      })
    })

    test('should both return false for invalid options', () => {
      const invalidInputs = [
        null,
        undefined,
        {},
        [],
        '4d6',
        20,
        true,
        D(6),
        D(['heads', 'tails']),
        { quantity: 1 }, // missing sides
        { sides: null },
        { sides: undefined }
      ]

      invalidInputs.forEach((input) => {
        expect(isCustomRollOptions(input)).toBe(false)
        expect(isNumericRollOptions(input)).toBe(false)
      })
    })
  })

  describe('Type narrowing', () => {
    test('should provide proper TypeScript type narrowing for numeric options', () => {
      const options: unknown = createNumericRollOptions({
        sides: 6,
        quantity: 4
      })

      if (isNumericRollOptions(options)) {
        // TypeScript should know this is NumericRollOptions
        const sides: number = options.sides
        const quantity: number | undefined = options.quantity
        expect(typeof sides).toBe('number')
        expect(typeof quantity === 'number').toBe(true)
      }
    })

    test('should provide proper TypeScript type narrowing for custom options', () => {
      const options: unknown = createCustomRollOptions({
        sides: ['heads', 'tails']
      })

      if (isCustomRollOptions(options)) {
        // TypeScript should know this is CustomRollOptions
        const sides: string[] = options.sides
        const quantity: number | undefined = options.quantity
        expect(Array.isArray(sides)).toBe(true)
        expect(sides.every((face) => typeof face === 'string')).toBe(true)
        expect(typeof quantity === 'number').toBe(true)
      }
    })

    test('should enable type-safe options processing', () => {
      const options = [
        createNumericRollOptions({ sides: 6 }),
        createCustomRollOptions({ sides: ['heads', 'tails'] }),
        { sides: 20, quantity: 2 },
        { sides: ['red', 'blue', 'green'] }
      ]

      const numericOptions: unknown[] = []
      const customOptions: unknown[] = []

      options.forEach((option) => {
        if (isNumericRollOptions(option)) {
          numericOptions.push(option)
          expect(typeof option.sides).toBe('number')
        } else if (isCustomRollOptions(option)) {
          customOptions.push(option)
          expect(Array.isArray(option.sides)).toBe(true)
        }
      })

      expect(numericOptions).toHaveLength(2)
      expect(customOptions).toHaveLength(2)
    })
  })
})
