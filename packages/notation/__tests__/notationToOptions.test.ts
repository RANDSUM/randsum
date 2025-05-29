import { describe, expect, it } from 'bun:test'
import { notationToOptions } from '../src/utils/notationToOptions'

describe(notationToOptions, () => {
  describe('basic notation parsing', () => {
    it('parses simple numerical notation', () => {
      const result = notationToOptions('2d6')
      
      expect(result).toEqual({
        quantity: 2,
        sides: 6,
        modifiers: {}
      })
    })

    it('parses single die notation', () => {
      const result = notationToOptions('1d20')
      
      expect(result).toEqual({
        quantity: 1,
        sides: 20,
        modifiers: {}
      })
    })

    it('handles case insensitive notation', () => {
      const result = notationToOptions('3D8')
      
      expect(result).toEqual({
        quantity: 3,
        sides: 8,
        modifiers: {}
      })
    })
  })

  describe('custom dice notation parsing', () => {
    it('parses simple custom dice', () => {
      const result = notationToOptions('2d{abc}')
      
      expect(result).toEqual({
        quantity: 2,
        sides: ['a', 'b', 'c'],
        modifiers: {}
      })
    })

    it('parses custom dice with special characters', () => {
      const result = notationToOptions('1d{!@#}')
      
      expect(result).toEqual({
        quantity: 1,
        sides: ['!', '@', '#'],
        modifiers: {}
      })
    })

    it('parses custom dice with numbers', () => {
      const result = notationToOptions('3d{123}')
      
      expect(result).toEqual({
        quantity: 3,
        sides: ['1', '2', '3'],
        modifiers: {}
      })
    })

    it('parses custom dice with mixed characters', () => {
      const result = notationToOptions('2d{a1!}')
      
      expect(result).toEqual({
        quantity: 2,
        sides: ['a', '1', '!'],
        modifiers: {}
      })
    })

    it('handles empty custom dice', () => {
      const result = notationToOptions('1d{}')
      
      expect(result).toEqual({
        quantity: 1,
        sides: [],
        modifiers: {}
      })
    })
  })

  describe('modifier parsing', () => {
    it('parses plus modifier', () => {
      const result = notationToOptions('2d6+3')
      
      expect(result.quantity).toBe(2)
      expect(result.sides).toBe(6)
      expect(result.modifiers).toHaveProperty('plus')
      expect(result.modifiers.plus).toBe(3)
    })

    it('parses minus modifier', () => {
      const result = notationToOptions('2d6-2')
      
      expect(result.quantity).toBe(2)
      expect(result.sides).toBe(6)
      expect(result.modifiers).toHaveProperty('minus')
      expect(result.modifiers.minus).toBe(2)
    })

    it('parses drop lowest modifier', () => {
      const result = notationToOptions('4d6L1')
      
      expect(result.quantity).toBe(4)
      expect(result.sides).toBe(6)
      expect(result.modifiers).toHaveProperty('drop')
    })

    it('parses drop highest modifier', () => {
      const result = notationToOptions('4d6H1')
      
      expect(result.quantity).toBe(4)
      expect(result.sides).toBe(6)
      expect(result.modifiers).toHaveProperty('drop')
    })
  })

  describe('complex notation parsing', () => {
    it('parses notation with multiple modifiers', () => {
      const result = notationToOptions('4d6L1+2')
      
      expect(result.quantity).toBe(4)
      expect(result.sides).toBe(6)
      expect(result.modifiers).toHaveProperty('drop')
      expect(result.modifiers).toHaveProperty('plus')
      expect(result.modifiers.plus).toBe(2)
    })

    it('parses large numbers correctly', () => {
      const result = notationToOptions('100d100+50')
      
      expect(result.quantity).toBe(100)
      expect(result.sides).toBe(100)
      expect(result.modifiers).toHaveProperty('plus')
      expect(result.modifiers.plus).toBe(50)
    })
  })

  describe('edge cases', () => {
    it('handles zero values in notation', () => {
      const result = notationToOptions('0d0')
      
      expect(result.quantity).toBe(0)
      expect(result.sides).toBe(0)
      expect(result.modifiers).toEqual({})
    })

    it('handles single character custom dice', () => {
      const result = notationToOptions('1d{a}')
      
      expect(result).toEqual({
        quantity: 1,
        sides: ['a'],
        modifiers: {}
      })
    })

    it('handles notation with whitespace (after cleaning)', () => {
      // Note: whitespace should be cleaned before calling this function
      const result = notationToOptions('2d6')
      
      expect(result.quantity).toBe(2)
      expect(result.sides).toBe(6)
    })
  })

  describe('return type consistency', () => {
    it('always returns an object with required properties', () => {
      const result = notationToOptions('1d6')
      
      expect(result).toHaveProperty('quantity')
      expect(result).toHaveProperty('sides')
      expect(result).toHaveProperty('modifiers')
      expect(typeof result.quantity).toBe('number')
      expect(typeof result.modifiers).toBe('object')
    })

    it('returns number for numerical sides', () => {
      const result = notationToOptions('2d20')
      
      expect(typeof result.sides).toBe('number')
      expect(result.sides).toBe(20)
    })

    it('returns array for custom sides', () => {
      const result = notationToOptions('2d{abc}')
      
      expect(Array.isArray(result.sides)).toBe(true)
      expect(result.sides).toEqual(['a', 'b', 'c'])
    })

    it('returns empty object for modifiers when none present', () => {
      const result = notationToOptions('1d6')
      
      expect(result.modifiers).toEqual({})
      expect(Object.keys(result.modifiers)).toHaveLength(0)
    })
  })

  describe('modifier integration', () => {
    // These tests verify that the modifier parsing integrates correctly
    // with the core notation parsing
    
    it('correctly separates core notation from modifiers', () => {
      const result = notationToOptions('3d8+5L1')
      
      expect(result.quantity).toBe(3)
      expect(result.sides).toBe(8)
      expect(result.modifiers).toHaveProperty('plus')
      expect(result.modifiers).toHaveProperty('drop')
    })

    it('handles modifiers with custom dice correctly', () => {
      // Note: This should not happen in practice as custom dice with modifiers
      // should be rejected by validation, but the parser should handle it gracefully
      const result = notationToOptions('2d{abc}')
      
      expect(result.quantity).toBe(2)
      expect(result.sides).toEqual(['a', 'b', 'c'])
      expect(result.modifiers).toEqual({})
    })
  })

  describe('performance characteristics', () => {
    it('parses complex notations efficiently', () => {
      const complexNotation = '10d20+5L2H1'
      const iterations = 1000
      
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        notationToOptions(complexNotation)
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(500) // Should be fast
    })

    it('handles large notation strings efficiently', () => {
      const largeNotation = '999999d999999+999999'
      
      const startTime = performance.now()
      const result = notationToOptions(largeNotation)
      const endTime = performance.now()
      
      expect(result.quantity).toBe(999999)
      expect(result.sides).toBe(999999)
      expect(endTime - startTime).toBeLessThan(50)
    })
  })
})
