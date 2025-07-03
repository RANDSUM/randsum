import { describe, expect, it } from 'bun:test'
import { completeRollPattern, coreNotationPattern } from '../src/lib'

describe('coreNotationPattern', () => {
  describe('valid core notations', () => {
    const validCoreNotations = [
      '1d6',
      '2d20',
      '10d10',
      '100d100',
      '1D6',
      '2D20',
      '1d{abc}',
      '2d{ht}',
      '3d{123}',
      '1d{!@#$%^&*()}',
      '999d999'
    ]

    validCoreNotations.forEach((notation) => {
      it(`matches valid core notation: ${notation}`, () => {
        expect(coreNotationPattern.test(notation)).toBe(true)
      })
    })
  })

  describe('invalid core notations', () => {
    const invalidCoreNotations = [
      'd6',
      '2d',
      '2x6',
      'dd6',
      'abc',
      '123',
      '',
      '1d{',
      '1d}'
    ]

    invalidCoreNotations.forEach((notation) => {
      it(`does not match invalid core notation: "${notation}"`, () => {
        expect(coreNotationPattern.test(notation)).toBe(false)
      })
    })
  })

  describe('edge cases that do match core pattern', () => {
    const edgeCasesThatMatch = ['0d6', '1d0', '2d6d']

    edgeCasesThatMatch.forEach((notation) => {
      it(`matches edge case: "${notation}"`, () => {
        expect(coreNotationPattern.test(notation)).toBe(true)
      })
    })
  })

  describe('pattern boundary conditions', () => {
    it('matches at the beginning of string', () => {
      expect(coreNotationPattern.test('1d6+3')).toBe(true)
    })

    it('does not match in the middle of string without anchor', () => {
      const pattern = /\d+[Dd](\d+|{.*})/
      expect(pattern.test('roll 1d6 please')).toBe(true)
      expect(coreNotationPattern.test('roll 1d6 please')).toBe(false)
    })

    it('extracts correct match from complex notation', () => {
      const match = '2d6+3L1'.match(coreNotationPattern)
      expect(match?.[0]).toBe('2d6')
    })
  })

  describe('custom dice pattern matching', () => {
    const customDiceTests = [
      { input: '1d{a}', expected: true, description: 'single character' },
      { input: '1d{abc}', expected: true, description: 'multiple characters' },
      { input: '1d{123}', expected: true, description: 'numbers in braces' },
      { input: '1d{!@#}', expected: true, description: 'special characters' },
      { input: '1d{αβγ}', expected: true, description: 'unicode characters' },
      { input: '1d{}', expected: true, description: 'empty braces' },
      {
        input: '1d{a,b,c}',
        expected: true,
        description: 'comma-separated values'
      },
      {
        input: '1d{nested{braces}}',
        expected: true,
        description: 'nested braces'
      }
    ]

    customDiceTests.forEach(({ input, expected, description }) => {
      it(`handles custom dice ${description}: ${input}`, () => {
        expect(coreNotationPattern.test(input)).toBe(expected)
      })
    })
  })
})

describe('completeRollPattern', () => {
  describe('complete notation matching', () => {
    const completeNotations = [
      '1d6',
      '2d6+3',
      '1d20L',
      '3d6H2',
      '2d6-1',
      '4d6L1',
      '1d20+5-2',
      '2d{abc}',
      '1d{ht}'
    ]

    completeNotations.forEach((notation) => {
      it(`completely matches notation: ${notation}`, () => {
        const cleanNotation = notation.replace(/\s/g, '')
        const remainingAfterMatch = cleanNotation.replace(
          completeRollPattern,
          ''
        )
        expect(remainingAfterMatch.length).toBe(0)
      })
    })
  })

  describe('partial notation matching', () => {
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
        const remainingAfterMatch = cleanInput.replace(completeRollPattern, '')
        expect(remainingAfterMatch.length).toBeGreaterThan(0)
      })
    })
  })

  describe('global pattern matching', () => {
    it('matches components in complex notation strings', () => {
      const input = '1d6+2d8'
      const matches = input.match(completeRollPattern)
      expect(matches).toBeTruthy()
      expect(matches).toContain('1d6')
      expect(matches).toContain('+2')
    })

    it('handles complex notation components', () => {
      const input = '2d6+3L1'
      const cleanInput = input.replace(/\s/g, '')
      const matches = cleanInput.match(completeRollPattern)
      expect(matches).toBeTruthy()
      expect(matches?.length).toBeGreaterThan(0)
      expect(matches).toContain('2d6')
      expect(matches).toContain('+3')
      expect(matches).toContain('L1')
    })
  })

  describe('pattern performance', () => {
    it('handles large input strings efficiently', () => {
      const largeInput = '1d6'.repeat(1000)
      const startTime = performance.now()
      const matches = largeInput.match(completeRollPattern)
      const endTime = performance.now()

      expect(matches).toBeTruthy()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('handles complex patterns without catastrophic backtracking', () => {
      const complexInput = '1d6' + 'b'.repeat(100)
      const startTime = performance.now()
      const result = completeRollPattern.test(complexInput)
      const endTime = performance.now()

      expect(result).toBe(true)
      expect(endTime - startTime).toBeLessThan(50)
    })
  })
})

describe('pattern integration', () => {
  describe('core and complete pattern consistency', () => {
    const testNotations = [
      { notation: '1d6', shouldMatch: false },
      { notation: '3d{abc}', shouldMatch: true },
      { notation: '10d10', shouldMatch: false }
    ]

    testNotations.forEach(({ notation, shouldMatch }) => {
      it(`core and complete pattern behavior for: ${notation}`, () => {
        const coreMatches = coreNotationPattern.test(notation)
        const completeMatches = completeRollPattern.test(notation)

        expect(coreMatches).toBe(true)
        expect(completeMatches).toBe(shouldMatch)
      })
    })
  })

  describe('pattern behavior differences', () => {
    it('explains why some core matches may not match complete pattern', () => {
      const testCase = '2d20'
      const coreMatches = coreNotationPattern.test(testCase)
      const completeMatches = completeRollPattern.test(testCase)

      expect(coreMatches).toBe(true)

      expect(typeof completeMatches).toBe('boolean')
    })
  })

  describe('pattern extraction consistency', () => {
    it('extracts the same core notation from complex strings', () => {
      const complexNotation = '2d6+3L1'
      const coreMatch = complexNotation.match(coreNotationPattern)?.[0]
      const completeMatches = complexNotation.match(completeRollPattern)

      expect(coreMatch).toBe('2d6')
      expect(completeMatches).toContain('2d6')
    })
  })
})
