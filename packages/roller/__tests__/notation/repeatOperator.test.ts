import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'
import { validateNotation } from '../../src/notation/validateNotation'
import { tokenize } from '../../src/notation/tokenize'

describe('Repeat Operator (xN)', () => {
  describe('isDiceNotation', () => {
    test('validates 1d6x3', () => {
      expect(isDiceNotation('1d6x3')).toBe(true)
    })

    test('validates 4d6Lx6', () => {
      expect(isDiceNotation('4d6Lx6')).toBe(true)
    })

    test('validates uppercase X', () => {
      expect(isDiceNotation('2d8X4')).toBe(true)
    })

    test('validates x1 (single repeat)', () => {
      expect(isDiceNotation('1d20x1')).toBe(true)
    })

    test('rejects x0 (zero repeats)', () => {
      expect(isDiceNotation('1d6x0')).toBe(false)
    })
  })

  describe('notationToOptions (expansion)', () => {
    test('expands 1d6x3 to three 1d6 rolls', () => {
      const results = notationToOptions('1d6x3')
      expect(results.length).toBe(3)
      for (const r of results) {
        expect(r.quantity).toBe(1)
        expect(r.sides).toBe(6)
      }
    })

    test('expands 4d6Lx2 preserving modifiers', () => {
      const results = notationToOptions('4d6Lx2')
      expect(results.length).toBe(2)
      for (const r of results) {
        expect(r.quantity).toBe(4)
        expect(r.sides).toBe(6)
        expect(r.modifiers?.drop?.lowest).toBe(1)
      }
    })

    test('expands 2d8+3x2 preserving arithmetic modifier', () => {
      const results = notationToOptions('2d8+3x2')
      expect(results.length).toBe(2)
      for (const r of results) {
        expect(r.quantity).toBe(2)
        expect(r.sides).toBe(8)
        expect(r.modifiers?.plus).toBe(3)
      }
    })

    test('expands 1d20x1 to single roll (identity)', () => {
      const results = notationToOptions('1d20x1')
      expect(results.length).toBe(1)
      expect(results[0]?.quantity).toBe(1)
      expect(results[0]?.sides).toBe(20)
    })

    test('uppercase X works the same', () => {
      const results = notationToOptions('1d6X3')
      expect(results.length).toBe(3)
    })
  })

  describe('validateNotation', () => {
    test('validates 1d6x3 as valid', () => {
      const result = validateNotation('1d6x3')
      expect(result.valid).toBe(true)
    })

    test('validates 4d6Lx6 as valid', () => {
      const result = validateNotation('4d6Lx6')
      expect(result.valid).toBe(true)
    })

    test('returns multiple options for expanded notation', () => {
      const result = validateNotation('1d6x3')
      if (result.valid) {
        expect(result.options.length).toBe(3)
      }
    })
  })

  describe('tokenize', () => {
    test('tokenizes xN suffix as repeat token', () => {
      const tokens = tokenize('1d6x3')
      const repeatToken = tokens.find(t => t.category === 'Special')
      expect(repeatToken).toBeDefined()
      expect(repeatToken?.text).toBe('x3')
    })

    test('tokenizes XN suffix (uppercase)', () => {
      const tokens = tokenize('2d8X4')
      const repeatToken = tokens.find(t => t.category === 'Special')
      expect(repeatToken).toBeDefined()
      expect(repeatToken?.text).toBe('X4')
    })
  })
})
