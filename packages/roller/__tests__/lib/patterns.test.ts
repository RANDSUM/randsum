import { describe, expect, it } from 'bun:test'
import {
  completeRollPattern,
  coreNotationPattern,
  createCompleteRollPattern
} from '../../src/lib/patterns'

describe('coreNotationPattern', () => {
  describe('valid core notations', () => {
    const validCoreNotations = ['1d6', '2d20', '10d10', '100d100', '1D6', '2D20', '999d999']

    validCoreNotations.forEach(notation => {
      it(`matches valid core notation: ${notation}`, () => {
        expect(coreNotationPattern.test(notation)).toBe(true)
      })
    })
  })

  describe('invalid core notations', () => {
    const invalidCoreNotations = ['d6', '2d', '2x6', 'dd6', 'abc', '123', '', '1d{', '1d}']

    invalidCoreNotations.forEach(notation => {
      it(`does not match invalid core notation: "${notation}"`, () => {
        expect(coreNotationPattern.test(notation)).toBe(false)
      })
    })
  })

  describe('edge cases that do match core pattern', () => {
    const edgeCasesThatMatch = ['0d6', '1d0', '2d6d']

    edgeCasesThatMatch.forEach(notation => {
      it(`matches edge case: "${notation}"`, () => {
        expect(coreNotationPattern.test(notation)).toBe(true)
      })
    })
  })

  describe('pattern boundary conditions', () => {
    it('matches at the beginning of string', () => {
      expect(coreNotationPattern.test('1d6+3')).toBe(true)
    })

    it('extracts correct match from complex notation', () => {
      const match = '2d6+3L1'.match(coreNotationPattern)
      expect(match?.[0]).toBe('2d6')
    })
  })
})

describe('completeRollPattern', () => {
  describe('complete notation matching (using global pattern)', () => {
    const completeNotations = ['1d6', '2d6+3', '1d20L', '3d6H2', '2d6-1', '4d6L1', '1d20+5-2']

    completeNotations.forEach(notation => {
      it(`completely matches notation: ${notation}`, () => {
        const cleanNotation = notation.replace(/\s/g, '')
        const remainingAfterMatch = cleanNotation.replaceAll(createCompleteRollPattern(), '')
        expect(remainingAfterMatch.length).toBe(0)
      })
    })
  })

  describe('partial notation matching (using global pattern)', () => {
    const partialNotations = [
      { input: '1d6extra', description: 'extra text after valid notation' },
      { input: 'prefix1d6', description: 'prefix before valid notation' },
      {
        input: '1d6+3invalid',
        description: 'invalid modifier after valid notation'
      }
    ]

    partialNotations.forEach(({ input, description }) => {
      it(`leaves remainder for ${description}: ${input}`, () => {
        const cleanInput = input.replace(/\s/g, '')
        const remainingAfterMatch = cleanInput.replaceAll(createCompleteRollPattern(), '')
        expect(remainingAfterMatch.length).toBeGreaterThan(0)
      })
    })
  })

  describe('global pattern matching', () => {
    it('handles complex notation components', () => {
      const input = '2d6+3L1'
      const cleanInput = input.replace(/\s/g, '')
      const matches = Array.from(cleanInput.matchAll(createCompleteRollPattern()))
      expect(matches).toBeTruthy()
      expect(matches.length).toBeGreaterThan(0)
      const matchedStrings = matches.map(m => m[0])
      expect(matchedStrings).toContain('2d6')
      expect(matchedStrings).toContain('+3')
      expect(matchedStrings).toContain('L1')
    })
  })

  describe('non-global pattern (single match)', () => {
    it('matches first component only with non-global pattern', () => {
      const result = completeRollPattern.test('2d6+3L1')
      expect(result).toBe(true)
    })

    it('can be used safely in loops without state issues', () => {
      const notations = ['1d6', '2d20', '4d6L']
      const results = notations.map(n => completeRollPattern.test(n))
      expect(results).toEqual([true, true, true])
    })
  })

  describe('pattern performance', () => {
    it('handles large input strings efficiently', () => {
      const largeInput = '1d6'.repeat(1000)
      const startTime = performance.now()
      const matches = Array.from(largeInput.matchAll(createCompleteRollPattern()))
      const endTime = performance.now()

      expect(matches).toBeTruthy()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('handles complex patterns without catastrophic backtracking', () => {
      const complexInput = `1d6${'b'.repeat(100)}`
      const startTime = performance.now()
      const result = completeRollPattern.test(complexInput)
      const endTime = performance.now()

      expect(result).toBe(true)
      expect(endTime - startTime).toBeLessThan(50)
    })
  })
})
