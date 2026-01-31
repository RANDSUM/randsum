import { describe, expect, test } from 'bun:test'
import { validateNotation } from '../src/validateNotation'
import { isSuccess } from '../src/lib/utils'

describe('validateNotation', () => {
  describe('valid notation', () => {
    test('validates basic dice notation', () => {
      const result = validateNotation('1d6')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]).toHaveProperty('sides', 6)
        expect(result.data.options[0]).toHaveProperty('quantity', 1)
        expect(result.data.notation[0]).toBe('1d6')
        expect(result.data.description[0]).toContain('Roll 1 6-sided die')
      }
    })

    test('validates basic negative dice notation', () => {
      const result = validateNotation('-1d6')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]).toHaveProperty('sides', 6)
        expect(result.data.options[0]).toHaveProperty('quantity', 1)
        expect(result.data.notation[0]).toBe('-1d6')
        expect(result.data.description[0]).toContain('Roll 1 6-sided die')
        expect(result.data.description[0]).toContain('and Subtract the result')
      }
    })

    test('validates multiple dice notation', () => {
      const result = validateNotation('4d6')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(6)
        expect(result.data.options[0]?.quantity).toBe(4)
        expect(result.data.notation[0]).toBe('4d6')
        expect(result.data.description[0]).toContain('Roll 4 6-sided dice')
      }
    })

    test('validates notation with plus modifier', () => {
      const result = validateNotation('2d8+3')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(8)
        expect(result.data.options[0]?.quantity).toBe(2)
        expect(result.data.options[0]?.modifiers?.plus).toBe(3)
        expect(result.data.notation[0]).toBe('2d8+3')
        expect(result.data.description[0]).toContain('Roll 2 8-sided dice')
        expect(result.data.description[0]).toContain('Add 3')
      }
    })

    test('validates notation with minus modifier', () => {
      const result = validateNotation('3d10-2')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(10)
        expect(result.data.options[0]?.quantity).toBe(3)
        expect(result.data.options[0]?.modifiers?.minus).toBe(2)
        expect(result.data.notation[0]).toBe('3d10-2')
        expect(result.data.description[0]).toContain('Roll 3 10-sided dice')
        expect(result.data.description[0]).toContain('Subtract 2')
      }
    })

    test('validates notation with drop lowest modifier', () => {
      const result = validateNotation('4d6L')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(6)
        expect(result.data.options[0]?.quantity).toBe(4)
        expect(result.data.options[0]?.modifiers?.drop?.lowest).toBe(1)
        expect(result.data.notation[0]).toBe('4d6L')
        expect(result.data.description[0]).toContain('Roll 4 6-sided dice')
        expect(result.data.description[0]).toContain('Drop lowest')
      }
    })

    test('validates notation with drop highest modifier', () => {
      const result = validateNotation('2d20H')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(20)
        expect(result.data.options[0]?.quantity).toBe(2)
        expect(result.data.options[0]?.modifiers?.drop?.highest).toBe(1)
        expect(result.data.notation[0]).toBe('2d20H')
        expect(result.data.description[0]).toContain('Roll 2 20-sided dice')
        expect(result.data.description[0]).toContain('Drop highest')
      }
    })

    test('validates notation with exploding dice', () => {
      const result = validateNotation('3d6!')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(6)
        expect(result.data.options[0]?.quantity).toBe(3)
        expect(result.data.options[0]?.modifiers?.explode).toBe(true)
        expect(result.data.notation[0]).toBe('3d6!')
        expect(result.data.description[0]).toContain('Roll 3 6-sided dice')
        expect(result.data.description[0]).toContain('Exploding Dice')
      }
    })

    test('validates notation with reroll modifier', () => {
      const result = validateNotation('4d6R{1}')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(6)
        expect(result.data.options[0]?.quantity).toBe(4)
        expect(result.data.options[0]?.modifiers?.reroll?.exact).toContain(1)
        expect(result.data.notation[0]).toBe('4d6R{1}')
        expect(result.data.description[0]).toContain('Roll 4 6-sided dice')
        expect(result.data.description[0]).toContain('Reroll [1]')
      }
    })

    test('validates notation with unique modifier', () => {
      const result = validateNotation('5d20U')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(20)
        expect(result.data.options[0]?.quantity).toBe(5)
        expect(result.data.options[0]?.modifiers?.unique).toBe(true)
        expect(result.data.notation[0]).toBe('5d20U')
        expect(result.data.description[0]).toContain('Roll 5 20-sided dice')
        expect(result.data.description[0]).toContain('No Duplicate Rolls')
      }
    })

    test('validates complex notation with multiple modifiers', () => {
      const result = validateNotation('4d6LR{1}+3')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(6)
        expect(result.data.options[0]?.quantity).toBe(4)
        expect(result.data.options[0]?.modifiers?.drop?.lowest).toBe(1)
        expect(result.data.options[0]?.modifiers?.reroll?.exact).toContain(1)
        expect(result.data.options[0]?.modifiers?.plus).toBe(3)
        expect(result.data.notation[0]).toBe('4d6LR{1}+3')
        expect(result.data.description[0]).toContain('Roll 4 6-sided dice')
        expect(result.data.description[0]).toContain('Drop lowest')
        expect(result.data.description[0]).toContain('Reroll [1]')
        expect(result.data.description[0]).toContain('Add 3')
      }
    })

    test('validates uppercase notation', () => {
      const result = validateNotation('2D10')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(10)
        expect(result.data.options[0]?.quantity).toBe(2)
        expect(result.data.notation[0]).toBe('2d10')
      }
    })
  })

  describe('invalid notation', () => {
    test('rejects empty string', () => {
      const result = validateNotation('')

      expect(result.success).toBe(false)
    })

    test('rejects non-dice notation', () => {
      const result = validateNotation('hello world')

      expect(result.success).toBe(false)
    })

    test('rejects incomplete notation', () => {
      const result = validateNotation('d6')

      expect(result.success).toBe(false)
    })

    test('rejects notation without sides', () => {
      const result = validateNotation('2d')

      expect(result.success).toBe(false)
    })

    test('rejects malformed notation', () => {
      const result = validateNotation('2x6')

      expect(result.success).toBe(false)
    })

    test('rejects notation with invalid characters', () => {
      const result = validateNotation('1d6@')

      expect(result.success).toBe(false)
    })

    test('rejects notation with extra text', () => {
      const result = validateNotation('roll 1d6')

      expect(result.success).toBe(false)
    })
  })

  describe('edge cases', () => {
    test('validates zero-sided dice', () => {
      const result = validateNotation('1d0')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(0)
        expect(result.data.options[0]?.quantity).toBe(1)
      }
    })

    test('validates zero quantity dice', () => {
      const result = validateNotation('0d6')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(6)
        expect(result.data.options[0]?.quantity).toBe(0)
      }
    })

    test('validates large numbers', () => {
      const result = validateNotation('999d999')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(999)
        expect(result.data.options[0]?.quantity).toBe(999)
      }
    })

    test('validates single-sided die', () => {
      const result = validateNotation('1d1')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]?.sides).toBe(1)
        expect(result.data.options[0]?.quantity).toBe(1)
      }
    })
  })

  describe('consistency with roll function', () => {
    test('validated notation can be used with roll function', () => {
      const result = validateNotation('3d8+2')

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.options[0]).toHaveProperty('sides')
        expect(result.data.options[0]).toHaveProperty('quantity')
        expect(typeof result.data.options[0]?.sides).toBe('number')
        expect(typeof result.data.options[0]?.quantity).toBe('number')

        if (result.data.options[0]?.modifiers) {
          expect(typeof result.data.options[0].modifiers).toBe('object')
        }
      }
    })

    test('regenerated notation matches original for simple cases', () => {
      const original = '2d10'
      const result = validateNotation(original)

      expect(result.success).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.notation[0]).toBe(original)
      }
    })
  })
})
