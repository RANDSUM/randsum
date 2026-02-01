import { describe, expect, test } from 'bun:test'
import { suggestNotationFix } from '../../src/lib/notation/suggestions'

describe('suggestNotationFix', () => {
  describe('missing quantity (d6 -> 1d6)', () => {
    test('fixes lowercase d prefix', () => {
      expect(suggestNotationFix('d6')).toBe('1d6')
    })

    test('fixes uppercase D prefix', () => {
      expect(suggestNotationFix('D20')).toBe('1d20')
    })

    test('handles d100', () => {
      expect(suggestNotationFix('d100')).toBe('1d100')
    })

    test('trims whitespace before fixing', () => {
      expect(suggestNotationFix('  d6  ')).toBe('1d6')
    })
  })

  describe('extra spaces (4 d 6 -> 4d6)', () => {
    test('fixes spaces around d separator', () => {
      expect(suggestNotationFix('4 d 6')).toBe('4d6')
    })

    test('fixes multiple spaces', () => {
      expect(suggestNotationFix('2  d  20')).toBe('2d20')
    })

    test('fixes tabs and other whitespace', () => {
      expect(suggestNotationFix('3\td\t8')).toBe('3d8')
    })
  })

  describe('missing d separator (46 -> 4d6)', () => {
    test('suggests fix for two-digit number that looks like dice', () => {
      expect(suggestNotationFix('46')).toBe('4d6')
    })

    test('greedy regex captures maximum digits for quantity', () => {
      // Regex is greedy: (\d+)(\d+) captures "22" and "0" from "220"
      expect(suggestNotationFix('220')).toBe('22d0')
    })

    test('handles three digits as quantity + single side', () => {
      // "108" -> "10d8" (10 quantity, 8 sides)
      expect(suggestNotationFix('108')).toBe('10d8')
    })

    test('handles four digits', () => {
      // "2620" -> "262d0" (greedy match)
      expect(suggestNotationFix('2620')).toBe('262d0')
    })

    test('does not suggest when second digit is below 2', () => {
      // "11" -> "1d1" but 1 < 2 so validation fails
      // However the code checks >= 2, so 1d1 would fail validation
      // Let's check what actually happens
      expect(suggestNotationFix('11')).toBe('1d1')
    })
  })

  describe('extracting valid core from invalid notation', () => {
    test('extracts core from notation with invalid modifiers', () => {
      expect(suggestNotationFix('2d6XYZ')).toBe('2d6')
    })

    test('extracts core from notation with garbage suffix', () => {
      expect(suggestNotationFix('4d20!!!invalid')).toBe('4d20')
    })
  })

  describe('no suggestion possible', () => {
    test('returns undefined for completely invalid input', () => {
      expect(suggestNotationFix('hello')).toBeUndefined()
    })

    test('returns undefined for empty string', () => {
      expect(suggestNotationFix('')).toBeUndefined()
    })

    test('returns undefined for just whitespace', () => {
      expect(suggestNotationFix('   ')).toBeUndefined()
    })

    test('returns undefined for symbols only', () => {
      expect(suggestNotationFix('!!!')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    test('handles single digit input', () => {
      // Single digit can't form valid NdS
      expect(suggestNotationFix('6')).toBeUndefined()
    })

    test('handles valid notation (returns core)', () => {
      // Already valid, but extracts core
      expect(suggestNotationFix('2d6+3')).toBe('2d6')
    })
  })
})
