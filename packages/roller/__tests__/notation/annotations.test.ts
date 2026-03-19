import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'
import { tokenize } from '../../src/notation/tokenize'
import { validateNotation } from '../../src/notation/validateNotation'

describe('Annotations/Labels ([text])', () => {
  describe('isDiceNotation', () => {
    test('validates notation with a single label', () => {
      expect(isDiceNotation('2d6+3[fire]')).toBe(true)
    })

    test('validates notation with multiple labels', () => {
      expect(isDiceNotation('2d6+3[fire]+1d4[cold]')).toBe(true)
    })

    test('validates notation with label on base roll only', () => {
      expect(isDiceNotation('1d20[attack]')).toBe(true)
    })

    test('validates notation with label containing spaces', () => {
      expect(isDiceNotation('2d6[fire damage]')).toBe(true)
    })

    test('validates notation with label after modifier', () => {
      expect(isDiceNotation('4d6L[ability score]')).toBe(true)
    })

    test('validates complex notation with labels', () => {
      expect(isDiceNotation('4d6L+3[fire]+1d4[cold]')).toBe(true)
    })
  })

  describe('notationToOptions', () => {
    test('parses notation with label - mechanics unchanged', () => {
      const withLabel = notationToOptions('2d6+3[fire]')
      const withoutLabel = notationToOptions('2d6+3')

      expect(withLabel).toHaveLength(1)
      expect(withLabel[0]?.quantity).toBe(withoutLabel[0]?.quantity)
      expect(withLabel[0]?.sides).toBe(withoutLabel[0]?.sides)
      expect(withLabel[0]?.modifiers?.plus).toBe(withoutLabel[0]?.modifiers?.plus)
    })

    test('stores label on parsed options', () => {
      const [result] = notationToOptions('2d6+3[fire]')

      expect(result?.label).toBe('fire')
    })

    test('stores label with spaces', () => {
      const [result] = notationToOptions('2d6[fire damage]')

      expect(result?.label).toBe('fire damage')
    })

    test('parses multi-roll expression with labels', () => {
      const results = notationToOptions('2d6+3[fire]+1d4[cold]')

      expect(results).toHaveLength(2)
      expect(results[0]?.label).toBe('fire')
      expect(results[1]?.label).toBe('cold')
    })

    test('label-less rolls have no label', () => {
      const [result] = notationToOptions('2d6+3')

      expect(result?.label).toBeUndefined()
    })

    test('label on the core roll (no modifiers)', () => {
      const [result] = notationToOptions('1d20[attack]')

      expect(result?.label).toBe('attack')
      expect(result?.quantity).toBe(1)
      expect(result?.sides).toBe(20)
    })

    test('label does not interfere with modifiers', () => {
      const [result] = notationToOptions('4d6L[ability score]')

      expect(result?.label).toBe('ability score')
      expect(result?.modifiers?.drop).toEqual({ lowest: 1 })
    })
  })

  describe('validateNotation', () => {
    test('validates notation with labels as valid', () => {
      const result = validateNotation('2d6+3[fire]')

      expect(result.valid).toBe(true)
    })

    test('validates multi-label notation as valid', () => {
      const result = validateNotation('2d6[fire]+1d4[cold]')

      expect(result.valid).toBe(true)
    })
  })

  describe('tokenize', () => {
    test('produces a label token', () => {
      const tokens = tokenize('2d6+3[fire]')
      const labelToken = tokens.find(t => t.category === 'Special')

      expect(labelToken).toBeDefined()
      expect(labelToken?.text).toBe('[fire]')
    })

    test('produces multiple label tokens', () => {
      const tokens = tokenize('2d6[fire]+1d4[cold]')
      const labelTokens = tokens.filter(t => t.category === 'Special')

      expect(labelTokens).toHaveLength(2)
      expect(labelTokens[0]?.text).toBe('[fire]')
      expect(labelTokens[1]?.text).toBe('[cold]')
    })
  })
})
