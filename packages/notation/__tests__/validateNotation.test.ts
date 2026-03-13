import { describe, expect, test } from 'bun:test'
import { validateNotation } from '@randsum/notation/validate'

describe('validateNotation', () => {
  describe('valid notation', () => {
    test('returns valid result for simple notation', () => {
      const result = validateNotation('2d6')

      expect(result.valid).toBe(true)
      expect(result.argument).toBe('2d6')
      expect(result.error).toBeNull()
      if (result.valid) {
        expect(result.options).toHaveLength(1)
        expect(result.notation).toHaveLength(1)
        expect(result.description).toHaveLength(1)
      }
    })

    test('returns parsed options for notation with modifiers', () => {
      const result = validateNotation('4d6L+3')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.options[0]?.quantity).toBe(4)
        expect(result.options[0]?.sides).toBe(6)
        expect(result.options[0]?.modifiers?.drop?.lowest).toBe(1)
        expect(result.options[0]?.modifiers?.plus).toBe(3)
      }
    })

    test('returns notation strings', () => {
      const result = validateNotation('2d20H')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.notation[0]).toBe('2d20H')
      }
    })

    test('returns description arrays', () => {
      const result = validateNotation('1d20')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.description[0]).toContain('Roll 1 20-sided die')
      }
    })
  })

  describe('invalid notation', () => {
    test('returns invalid result for garbage input', () => {
      const result = validateNotation('hello')

      expect(result.valid).toBe(false)
      expect(result.argument).toBe('hello')
      if (!result.valid) {
        expect(result.error.message).toContain('Invalid dice notation')
        expect(result.error.argument).toBe('hello')
      }
    })

    test('returns invalid result for empty string', () => {
      const result = validateNotation('')

      expect(result.valid).toBe(false)
    })

    test('returns invalid result for partial notation', () => {
      const result = validateNotation('d6')

      expect(result.valid).toBe(false)
    })
  })
})
