import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'
import { tokenize } from '../../src/notation/tokenize'
import { validateNotation } from '../../src/notation/validateNotation'

describe('Wild Die (W) notation', () => {
  describe('isDiceNotation', () => {
    test('validates basic wild die notation', () => {
      expect(isDiceNotation('5d6W')).toBe(true)
    })

    test('validates lowercase wild die notation', () => {
      expect(isDiceNotation('5d6w')).toBe(true)
    })

    test('validates wild die with other modifiers', () => {
      expect(isDiceNotation('5d6W+3')).toBe(true)
    })

    test('does not interfere with other W-like patterns', () => {
      // W not followed by { should be wild die, not confused with other modifiers
      expect(isDiceNotation('4d6W')).toBe(true)
    })
  })

  describe('notationToOptions', () => {
    test('parses wild die modifier', () => {
      const [result] = notationToOptions('5d6W')

      expect(result?.quantity).toBe(5)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.wildDie).toBe(true)
    })

    test('parses lowercase wild die', () => {
      const [result] = notationToOptions('5d6w')

      expect(result?.modifiers?.wildDie).toBe(true)
    })

    test('wild die with arithmetic', () => {
      const [result] = notationToOptions('5d6W+3')

      expect(result?.modifiers?.wildDie).toBe(true)
      expect(result?.modifiers?.plus).toBe(3)
    })
  })

  describe('validateNotation', () => {
    test('validates wild die notation as valid', () => {
      const result = validateNotation('5d6W')

      expect(result.valid).toBe(true)
    })

    test('includes wild die in description', () => {
      const result = validateNotation('5d6W')

      if (result.valid) {
        const desc = result.description[0] ?? []
        expect(desc.some(d => d.toLowerCase().includes('wild'))).toBe(true)
      }
    })
  })

  describe('tokenize', () => {
    test('produces a wildDie token', () => {
      const tokens = tokenize('5d6W')
      const wildToken = tokens.find(t => t.category === 'Dispatch')

      expect(wildToken).toBeDefined()
      expect(wildToken?.text).toBe('W')
    })

    test('produces lowercase wildDie token', () => {
      const tokens = tokenize('5d6w')
      const wildToken = tokens.find(t => t.category === 'Dispatch')

      expect(wildToken).toBeDefined()
      expect(wildToken?.text).toBe('w')
    })
  })
})
