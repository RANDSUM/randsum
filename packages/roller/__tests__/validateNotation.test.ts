import { describe, expect, test } from 'bun:test'
import { validateNotation } from '../src/validateNotation'
import type { ValidationResult } from '../src/types'

describe('validateNotation', () => {
  describe('valid notation', () => {
    test('validates basic dice notation', () => {
      const result = validateNotation('1d6')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested).toHaveProperty('sides', 6)
        expect(result.digested).toHaveProperty('quantity', 1)
        expect(result.notation).toBe('1d6')
        expect(result.description).toContain('Roll 1 6-sided die')
      }
    })

    test('validates basic negative dice notation', () => {
      const result = validateNotation('-1d6')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested).toHaveProperty('sides', 6)
        expect(result.digested).toHaveProperty('quantity', 1)
        expect(result.notation).toBe('-1d6')
        expect(result.description).toContain('Roll 1 6-sided die')
        expect(result.description).toContain('and Subtract the result')
      }
    })

    test('validates multiple dice notation', () => {
      const result = validateNotation('4d6')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(6)
        expect(result.digested.quantity).toBe(4)
        expect(result.notation).toBe('4d6')
        expect(result.description).toContain('Roll 4 6-sided dice')
      }
    })

    test('validates notation with plus modifier', () => {
      const result = validateNotation('2d8+3')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(8)
        expect(result.digested.quantity).toBe(2)
        expect(result.digested.modifiers?.plus).toBe(3)
        expect(result.notation).toBe('2d8+3')
        expect(result.description).toContain('Roll 2 8-sided dice')
        expect(result.description).toContain('Add 3')
      }
    })

    test('validates notation with minus modifier', () => {
      const result = validateNotation('3d10-2')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(10)
        expect(result.digested.quantity).toBe(3)
        expect(result.digested.modifiers?.minus).toBe(2)
        expect(result.notation).toBe('3d10-2')
        expect(result.description).toContain('Roll 3 10-sided dice')
        expect(result.description).toContain('Subtract 2')
      }
    })

    test('validates notation with drop lowest modifier', () => {
      const result = validateNotation('4d6L')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(6)
        expect(result.digested.quantity).toBe(4)
        expect(result.digested.modifiers?.drop?.lowest).toBe(1)
        expect(result.notation).toBe('4d6L')
        expect(result.description).toContain('Roll 4 6-sided dice')
        expect(result.description).toContain('Drop lowest')
      }
    })

    test('validates notation with drop highest modifier', () => {
      const result = validateNotation('2d20H')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(20)
        expect(result.digested.quantity).toBe(2)
        expect(result.digested.modifiers?.drop?.highest).toBe(1)
        expect(result.notation).toBe('2d20H')
        expect(result.description).toContain('Roll 2 20-sided dice')
        expect(result.description).toContain('Drop highest')
      }
    })

    test('validates notation with exploding dice', () => {
      const result = validateNotation('3d6!')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(6)
        expect(result.digested.quantity).toBe(3)
        expect(result.digested.modifiers?.explode).toBe(true)
        expect(result.notation).toBe('3d6!')
        expect(result.description).toContain('Roll 3 6-sided dice')
        expect(result.description).toContain('Exploding Dice')
      }
    })

    test('validates notation with reroll modifier', () => {
      const result = validateNotation('4d6R{1}')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(6)
        expect(result.digested.quantity).toBe(4)
        expect(result.digested.modifiers?.reroll?.exact).toContain(1)
        expect(result.notation).toBe('4d6R{1}')
        expect(result.description).toContain('Roll 4 6-sided dice')
        expect(result.description).toContain('Reroll [1]')
      }
    })

    test('validates notation with unique modifier', () => {
      const result = validateNotation('5d20U')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(20)
        expect(result.digested.quantity).toBe(5)
        expect(result.digested.modifiers?.unique).toBe(true)
        expect(result.notation).toBe('5d20U')
        expect(result.description).toContain('Roll 5 20-sided dice')
        expect(result.description).toContain('No Duplicate Rolls')
      }
    })

    test('validates complex notation with multiple modifiers', () => {
      const result = validateNotation('4d6LR{1}+3')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(6)
        expect(result.digested.quantity).toBe(4)
        expect(result.digested.modifiers?.drop?.lowest).toBe(1)
        expect(result.digested.modifiers?.reroll?.exact).toContain(1)
        expect(result.digested.modifiers?.plus).toBe(3)
        expect(result.notation).toBe('4d6LR{1}+3')
        expect(result.description).toContain('Roll 4 6-sided dice')
        expect(result.description).toContain('Drop lowest')
        expect(result.description).toContain('Reroll [1]')
        expect(result.description).toContain('Add 3')
      }
    })

    test('validates uppercase notation', () => {
      const result = validateNotation('2D10')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(10)
        expect(result.digested.quantity).toBe(2)
        expect(result.notation).toBe('2d10')
      }
    })
  })

  describe('invalid notation', () => {
    test('rejects empty string', () => {
      const result = validateNotation('')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.description).toContain('Invalid Notation')
        expect(result.digested).toEqual({})
      }
    })

    test('rejects non-dice notation', () => {
      const result = validateNotation('hello world')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.description).toContain('Invalid Notation')
        expect(result.digested).toEqual({})
      }
    })

    test('rejects incomplete notation', () => {
      const result = validateNotation('d6')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.description).toContain('Invalid Notation')
        expect(result.digested).toEqual({})
      }
    })

    test('rejects notation without sides', () => {
      const result = validateNotation('2d')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.description).toContain('Invalid Notation')
        expect(result.digested).toEqual({})
      }
    })

    test('rejects malformed notation', () => {
      const result = validateNotation('2x6')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.description).toContain('Invalid Notation')
        expect(result.digested).toEqual({})
      }
    })

    test('rejects notation with invalid characters', () => {
      const result = validateNotation('1d6@')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.description).toContain('Invalid Notation')
        expect(result.digested).toEqual({})
      }
    })

    test('rejects notation with extra text', () => {
      const result = validateNotation('roll 1d6')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.description).toContain('Invalid Notation')
        expect(result.digested).toEqual({})
      }
    })
  })

  describe('edge cases', () => {
    test('validates zero-sided dice', () => {
      const result = validateNotation('1d0')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(0)
        expect(result.digested.quantity).toBe(1)
      }
    })

    test('validates zero quantity dice', () => {
      const result = validateNotation('0d6')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(6)
        expect(result.digested.quantity).toBe(0)
      }
    })

    test('validates large numbers', () => {
      const result = validateNotation('999d999')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(999)
        expect(result.digested.quantity).toBe(999)
      }
    })

    test('validates single-sided die', () => {
      const result = validateNotation('1d1')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested.sides).toBe(1)
        expect(result.digested.quantity).toBe(1)
      }
    })
  })

  describe('return type validation', () => {
    test('returns ValidValidationResult for valid notation', () => {
      const result: ValidationResult = validateNotation('2d6+1')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result).toHaveProperty('digested')
        expect(result).toHaveProperty('notation')
        expect(result).toHaveProperty('description')
        expect(typeof result.notation).toBe('string')
        expect(Array.isArray(result.description)).toBe(true)
        expect(typeof result.digested).toBe('object')
      }
    })

    test('returns InvalidValidationResult for invalid notation', () => {
      const result: ValidationResult = validateNotation('invalid')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result).toHaveProperty('digested')
        expect(result).toHaveProperty('description')
        expect(result).not.toHaveProperty('notation')
        expect(Array.isArray(result.description)).toBe(true)
        expect(result.digested).toEqual({})
      }
    })
  })

  describe('consistency with roll function', () => {
    test('validated notation can be used with roll function', () => {
      const result = validateNotation('3d8+2')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.digested).toHaveProperty('sides')
        expect(result.digested).toHaveProperty('quantity')
        expect(typeof result.digested.sides).toBe('number')
        expect(typeof result.digested.quantity).toBe('number')

        if (result.digested.modifiers) {
          expect(typeof result.digested.modifiers).toBe('object')
        }
      }
    })

    test('regenerated notation matches original for simple cases', () => {
      const original = '2d10'
      const result = validateNotation(original)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.notation).toBe(original)
      }
    })
  })
})
