import { describe, expect, test } from 'bun:test'
import { D, isCustomDie, isD, isNumericDie } from '../../../src'

describe('Die Interface Type Guards', () => {
  describe('isD', () => {
    test('should return true for numeric dice', () => {
      const die = D(20)
      expect(isD(die)).toBe(true)

      if (isD(die)) {
        expect(die.type).toBe('numeric')
        expect(die.sides).toBe(20)
        expect(Array.isArray(die.faces)).toBe(true)
        expect(die.isCustom).toBe(false)
        expect(typeof die.roll).toBe('function')
        expect(typeof die.rollSpread).toBe('function')
        expect(typeof die.rollModified).toBe('function')
        expect(typeof die.toOptions).toBe('object')
      }
    })

    test('should return true for custom dice', () => {
      const die = D(['heads', 'tails'])
      expect(isD(die)).toBe(true)

      if (isD(die)) {
        expect(die.type).toBe('custom')
        expect(die.sides).toBe(2)
        expect(Array.isArray(die.faces)).toBe(true)
        expect(die.isCustom).toBe(true)
        expect(typeof die.roll).toBe('function')
        expect(typeof die.rollSpread).toBe('function')
        expect(typeof die.rollModified).toBe('function')
        expect(typeof die.toOptions).toBe('object')
      }
    })

    test('should return false for non-die objects', () => {
      expect(isD(null)).toBe(false)
      expect(isD(undefined)).toBe(false)
      expect(isD({})).toBe(false)
      expect(isD([])).toBe(false)
      expect(isD('4d6')).toBe(false)
      expect(isD(20)).toBe(false)
      expect(isD({ sides: 6 })).toBe(false)
      expect(isD({ type: 'numeric' })).toBe(false)
    })

    test('should return false for objects missing required properties', () => {
      const incomplete = {
        type: 'numeric',
        sides: 6,
        faces: [1, 2, 3, 4, 5, 6]
        // missing isCustom, roll, rollSpread, rollModified, toOptions
      }
      expect(isD(incomplete)).toBe(false)
    })

    test('should return false for objects with wrong type values', () => {
      const wrongType = {
        type: 'invalid',
        sides: 6,
        faces: [1, 2, 3, 4, 5, 6],
        isCustom: false,
        roll: () => 1,
        rollSpread: () => [1],
        rollModified: () => ({}) as unknown,
        toOptions: {}
      }
      expect(isD(wrongType)).toBe(false)
    })

    test('should work with array filtering', () => {
      const items = [D(6), D(['red', 'blue']), '4d6', 20, { sides: 6 }, null]

      const dice = items.filter(isD)
      expect(dice).toHaveLength(2)

      dice.forEach((die) => {
        expect(['numeric', 'custom'].includes(die.type)).toBe(true)
        expect(typeof die.sides).toBe('number')
        expect(Array.isArray(die.faces)).toBe(true)
      })
    })
  })

  describe('isNumericDie', () => {
    test('should return true for numeric dice', () => {
      const die = D(20)
      expect(isNumericDie(die)).toBe(true)

      if (isNumericDie(die)) {
        expect(die.type).toBe('numeric')
        expect(die.isCustom).toBe(false)
        expect(die.faces.every((f) => typeof f === 'number')).toBe(true)
      }
    })

    test('should return false for custom dice', () => {
      const die = D(['heads', 'tails'])
      expect(isNumericDie(die)).toBe(false)
    })

    test('should provide proper type narrowing', () => {
      const numericDie = D(6)
      const customDie = D(['a', 'b', 'c'])

      if (isNumericDie(numericDie)) {
        const roll: number = numericDie.roll()
        const rolls: number[] = numericDie.rollSpread(3)
        expect(typeof roll).toBe('number')
        expect(Array.isArray(rolls)).toBe(true)
        expect(rolls.every((r) => typeof r === 'number')).toBe(true)
      }

      expect(isNumericDie(customDie)).toBe(false)
    })

    test('should work with array filtering', () => {
      const dice = [
        D(6),
        D(20),
        D(['heads', 'tails']),
        D(['red', 'blue', 'green'])
      ]

      const numericDice = dice.filter(isNumericDie)
      expect(numericDice).toHaveLength(2)

      numericDice.forEach((die) => {
        expect(die.type).toBe('numeric')
        expect(die.isCustom).toBe(false)
      })
    })
  })

  describe('isCustomDie', () => {
    test('should return true for custom dice', () => {
      const die = D(['heads', 'tails'])
      expect(isCustomDie(die)).toBe(true)

      if (isCustomDie(die)) {
        expect(die.type).toBe('custom')
        expect(die.isCustom).toBe(true)
        expect(die.faces.every((f) => typeof f === 'string')).toBe(true)
      }
    })

    test('should return false for numeric dice', () => {
      const die = D(20)
      expect(isCustomDie(die)).toBe(false)
    })

    test('should provide proper type narrowing', () => {
      const customDie = D(['critical', 'hit', 'miss'])
      const numericDie = D(6)

      if (isCustomDie(customDie)) {
        const roll: string = customDie.roll()
        const rolls: string[] = customDie.rollSpread(3)
        expect(typeof roll).toBe('string')
        expect(Array.isArray(rolls)).toBe(true)
        expect(rolls.every((r) => typeof r === 'string')).toBe(true)
      }

      expect(isCustomDie(numericDie)).toBe(false)
    })

    test('should work with array filtering', () => {
      const dice = [
        D(6),
        D(20),
        D(['heads', 'tails']),
        D(['red', 'blue', 'green'])
      ]

      const customDice = dice.filter(isCustomDie)
      expect(customDice).toHaveLength(2)

      customDice.forEach((die) => {
        expect(die.type).toBe('custom')
        expect(die.isCustom).toBe(true)
      })
    })
  })

  describe('Type discrimination and narrowing', () => {
    test('should enable proper type-safe die processing', () => {
      const dice = [D(6), D(['heads', 'tails']), D(20), D(['red', 'blue'])]

      dice.forEach((die) => {
        if (isNumericDie(die)) {
          const numericRoll = die.roll()
          expect(typeof numericRoll).toBe('number')
          expect(numericRoll).toBeGreaterThanOrEqual(1)
          expect(numericRoll).toBeLessThanOrEqual(die.sides)
        } else if (isCustomDie(die)) {
          const customRoll = die.roll()
          expect(typeof customRoll).toBe('string')
          expect(die.faces.includes(customRoll)).toBe(true)
        } else {
          throw new Error('Unknown die type')
        }
      })
    })

    test('should handle switch-like logic correctly', () => {
      const numericDie = D(6)
      const customDie = D(['heads', 'tails'])

      // Test numeric die
      if (isD(numericDie)) {
        if (isNumericDie(numericDie)) {
          expect(numericDie.type).toBe('numeric')
          expect(numericDie.isCustom).toBe(false)
        } else if (isCustomDie(numericDie)) {
          throw new Error('Should not reach here')
        }
      }

      // Test custom die
      if (isD(customDie)) {
        if (isNumericDie(customDie)) {
          throw new Error('Should not reach here')
        } else if (isCustomDie(customDie)) {
          expect(customDie.type).toBe('custom')
          expect(customDie.isCustom).toBe(true)
        }
      }
    })
  })
})
