import { describe, expect, test } from 'bun:test'
import { D, isCustomRollParams, isNumericRollParams } from '../../../src'
import { argToParameter } from '../../../src/roll/argToParameter'
import {
  createCustomRollOptions,
  createNumericRollOptions
} from '../../support/fixtures'

describe('Roll Params Type Guards', () => {
  describe('isNumericRollParams', () => {
    test('should return true for numeric roll params', () => {
      const params = argToParameter('4d6')
      expect(isNumericRollParams(params)).toBe(true)

      if (isNumericRollParams(params)) {
        expect(typeof params.options.sides).toBe('number')
        expect(params.die.type).toBe('numeric')
        expect(params.die.isCustom).toBe(false)
        expect(typeof params.notation).toBe('string')
        expect(Array.isArray(params.description)).toBe(true)
      }
    })

    test('should return true for numeric params with modifiers', () => {
      const params = argToParameter('4d6L+2')
      expect(isNumericRollParams(params)).toBe(true)

      if (isNumericRollParams(params)) {
        expect(typeof params.options.sides).toBe('number')
        expect(params.options.modifiers).toBeDefined()
        expect(params.die.type).toBe('numeric')
      }
    })

    test('should return true for numeric params from die objects', () => {
      const params = argToParameter(D(20))
      expect(isNumericRollParams(params)).toBe(true)

      if (isNumericRollParams(params)) {
        expect(params.options.sides).toBe(20)
        expect(params.die.type).toBe('numeric')
        expect(params.die.sides).toBe(20)
      }
    })

    test('should return true for numeric params from options', () => {
      const options = createNumericRollOptions({ sides: 8, quantity: 3 })
      const params = argToParameter(options)
      expect(isNumericRollParams(params)).toBe(true)

      if (isNumericRollParams(params)) {
        expect(params.options.sides).toBe(8)
        expect(params.options.quantity).toBe(3)
        expect(params.die.type).toBe('numeric')
      }
    })

    test('should return true for numeric params from plain numbers', () => {
      const params = argToParameter(6)
      expect(isNumericRollParams(params)).toBe(true)

      if (isNumericRollParams(params)) {
        expect(params.options.sides).toBe(6)
        expect(params.die.type).toBe('numeric')
        expect(params.die.sides).toBe(6)
      }
    })

    test('should return true for complex numeric notation', () => {
      const params = argToParameter('4d6LR{1}!+3')
      expect(isNumericRollParams(params)).toBe(true)

      if (isNumericRollParams(params)) {
        expect(typeof params.options.sides).toBe('number')
        expect(params.options.modifiers).toBeDefined()
        expect(params.die.type).toBe('numeric')
      }
    })

    test('should return false for custom roll params', () => {
      const params = argToParameter(['heads', 'tails'])
      expect(isNumericRollParams(params)).toBe(false)
    })

    test('should return false for custom dice notation params', () => {
      const params = argToParameter('2d{HT}')
      expect(isNumericRollParams(params)).toBe(false)
    })

    test('should return false for custom die object params', () => {
      const params = argToParameter(D(['red', 'blue', 'green']))
      expect(isNumericRollParams(params)).toBe(false)
    })

    test('should return false for invalid inputs', () => {
      expect(isNumericRollParams(null)).toBe(false)
      expect(isNumericRollParams(undefined)).toBe(false)
      expect(isNumericRollParams({})).toBe(false)
      expect(isNumericRollParams([])).toBe(false)
      expect(isNumericRollParams('4d6')).toBe(false) // string, not params
      expect(isNumericRollParams(20)).toBe(false) // number, not params
    })

    test('should work with array filtering', () => {
      const params = [
        argToParameter('4d6'),
        argToParameter(['heads', 'tails']),
        argToParameter(D(20)),
        argToParameter('2d{HT}'),
        '4d6', // not params
        null
      ]

      const numericParams = params.filter(isNumericRollParams)
      expect(numericParams).toHaveLength(2)

      numericParams.forEach((param) => {
        expect(typeof param.options.sides).toBe('number')
        expect(param.die.type).toBe('numeric')
      })
    })
  })

  describe('isCustomRollParams', () => {
    test('should return true for custom roll params from string arrays', () => {
      const params = argToParameter(['heads', 'tails'])
      expect(isCustomRollParams(params)).toBe(true)

      if (isCustomRollParams(params)) {
        expect(Array.isArray(params.options.sides)).toBe(true)
        expect(params.die.type).toBe('custom')
        expect(params.die.isCustom).toBe(true)
        expect(typeof params.notation).toBe('string')
        expect(Array.isArray(params.description)).toBe(true)
      }
    })

    test('should return true for custom dice notation params', () => {
      const params = argToParameter('2d{HT}')
      expect(isCustomRollParams(params)).toBe(true)

      if (isCustomRollParams(params)) {
        expect(Array.isArray(params.options.sides)).toBe(true)
        expect(params.options.sides).toEqual(['H', 'T'])
        expect(params.die.type).toBe('custom')
      }
    })

    test('should return true for custom die object params', () => {
      const params = argToParameter(D(['red', 'blue', 'green']))
      expect(isCustomRollParams(params)).toBe(true)

      if (isCustomRollParams(params)) {
        expect(Array.isArray(params.options.sides)).toBe(true)
        expect(params.options.sides).toEqual(['red', 'blue', 'green'])
        expect(params.die.type).toBe('custom')
        expect(params.die.sides).toBe(3)
      }
    })

    test('should return true for custom options params', () => {
      const options = createCustomRollOptions({
        sides: ['critical', 'hit', 'miss'],
        quantity: 2
      })
      const params = argToParameter(options)
      expect(isCustomRollParams(params)).toBe(true)

      if (isCustomRollParams(params)) {
        expect(Array.isArray(params.options.sides)).toBe(true)
        expect(params.options.sides).toEqual(['critical', 'hit', 'miss'])
        expect(params.options.quantity).toBe(2)
        expect(params.die.type).toBe('custom')
      }
    })

    test('should return true for emoji face params', () => {
      const params = argToParameter(['⚔️', '🛡️', '🏹'])
      expect(isCustomRollParams(params)).toBe(true)

      if (isCustomRollParams(params)) {
        expect(Array.isArray(params.options.sides)).toBe(true)
        expect(params.options.sides).toEqual(['⚔️', '🛡️', '🏹'])
        expect(params.die.type).toBe('custom')
      }
    })

    test('should return true for complex custom notation params', () => {
      const params = argToParameter('3d{abc}')
      expect(isCustomRollParams(params)).toBe(true)

      if (isCustomRollParams(params)) {
        expect(Array.isArray(params.options.sides)).toBe(true)
        expect(params.options.sides).toEqual(['a', 'b', 'c'])
        expect(params.die.type).toBe('custom')
      }
    })

    test('should return false for numeric roll params', () => {
      const params = argToParameter('4d6')
      expect(isCustomRollParams(params)).toBe(false)
    })

    test('should return false for numeric die object params', () => {
      const params = argToParameter(D(20))
      expect(isCustomRollParams(params)).toBe(false)
    })

    test('should return false for numeric options params', () => {
      const options = createNumericRollOptions({ sides: 6, quantity: 4 })
      const params = argToParameter(options)
      expect(isCustomRollParams(params)).toBe(false)
    })

    test('should return false for plain number params', () => {
      const params = argToParameter(6)
      expect(isCustomRollParams(params)).toBe(false)
    })

    test('should return false for invalid inputs', () => {
      expect(isCustomRollParams(null)).toBe(false)
      expect(isCustomRollParams(undefined)).toBe(false)
      expect(isCustomRollParams({})).toBe(false)
      expect(isCustomRollParams([])).toBe(false)
      expect(isCustomRollParams('2d{HT}')).toBe(false) // string, not params
      expect(isCustomRollParams(['heads', 'tails'])).toBe(false) // array, not params
    })

    test('should work with array filtering', () => {
      const params = [
        argToParameter(['heads', 'tails']),
        argToParameter('4d6'),
        argToParameter('2d{HT}'),
        argToParameter(D(20)),
        '2d{HT}', // not params
        null
      ]

      const customParams = params.filter(isCustomRollParams)
      expect(customParams).toHaveLength(2)

      customParams.forEach((param) => {
        expect(Array.isArray(param.options.sides)).toBe(true)
        expect(param.die.type).toBe('custom')
      })
    })
  })

  describe('Mutual exclusivity', () => {
    test('should be mutually exclusive for valid params', () => {
      const validParams = [
        argToParameter('4d6'),
        argToParameter(['heads', 'tails']),
        argToParameter(D(20)),
        argToParameter('2d{HT}'),
        argToParameter(createNumericRollOptions()),
        argToParameter(createCustomRollOptions())
      ]

      validParams.forEach((param) => {
        const isCustom = isCustomRollParams(param)
        const isNumeric = isNumericRollParams(param)

        // Should be exactly one or the other, never both or neither
        expect(isCustom !== isNumeric).toBe(true)
      })
    })

    test('should both return false for invalid params', () => {
      const invalidInputs = [
        null,
        undefined,
        {},
        [],
        '4d6', // string, not params
        20, // number, not params
        ['heads', 'tails'], // array, not params
        true
      ]

      invalidInputs.forEach((input) => {
        expect(isCustomRollParams(input)).toBe(false)
        expect(isNumericRollParams(input)).toBe(false)
      })
    })
  })

  describe('Type narrowing', () => {
    test('should provide proper TypeScript type narrowing for numeric params', () => {
      const params: unknown = argToParameter('4d6+2')

      if (isNumericRollParams(params)) {
        // TypeScript should know this is NumericRollParams
        const sides: number = params.options.sides
        const die = params.die
        const notation: string = params.notation
        expect(typeof sides).toBe('number')
        expect(die.type).toBe('numeric')
        expect(typeof notation).toBe('string')
      }
    })

    test('should provide proper TypeScript type narrowing for custom params', () => {
      const params: unknown = argToParameter(['heads', 'tails'])

      if (isCustomRollParams(params)) {
        // TypeScript should know this is CustomRollParams
        const sides: string[] = params.options.sides
        const die = params.die
        const notation: string = params.notation
        expect(Array.isArray(sides)).toBe(true)
        expect(die.type).toBe('custom')
        expect(typeof notation).toBe('string')
      }
    })

    test('should enable type-safe params processing', () => {
      const params = [
        argToParameter('4d6'),
        argToParameter(['heads', 'tails']),
        argToParameter(D(20)),
        argToParameter('2d{HT}')
      ]

      const numericParams: unknown[] = []
      const customParams: unknown[] = []

      params.forEach((param) => {
        if (isNumericRollParams(param)) {
          numericParams.push(param)
          expect(typeof param.options.sides).toBe('number')
          expect(param.die.type).toBe('numeric')
        } else if (isCustomRollParams(param)) {
          customParams.push(param)
          expect(Array.isArray(param.options.sides)).toBe(true)
          expect(param.die.type).toBe('custom')
        }
      })

      expect(numericParams).toHaveLength(2)
      expect(customParams).toHaveLength(2)
    })
  })
})
