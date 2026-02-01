import { describe, expect, test } from 'bun:test'
import { listOfNotations } from '../../src/lib/notation/listOfNotations'

describe('listOfNotations', () => {
  describe('single notation', () => {
    test('extracts single notation', () => {
      const notation = '2d6'
      const matches = [...notation.matchAll(/\d+d\d+/g)]
      const result = listOfNotations(notation, matches)

      expect(result).toEqual(['2d6'])
    })

    test('extracts notation with modifiers', () => {
      const notation = '4d6L'
      const matches = [...notation.matchAll(/\d+d\d+/g)]
      const result = listOfNotations(notation, matches)

      expect(result).toEqual(['4d6L'])
    })
  })

  describe('multiple notations with arithmetic', () => {
    test('splits notation with plus between dice', () => {
      const notation = '1d20+2d6'
      const matches = [...notation.matchAll(/\d+d\d+/g)]
      const result = listOfNotations(notation, matches)

      expect(result).toHaveLength(2)
      // The split happens at the arithmetic operator
      expect(result[0]).toBe('1d20+')
      expect(result[1]).toBe('+2d6')
    })

    test('splits notation with minus between dice', () => {
      const notation = '1d20-1d4'
      const matches = [...notation.matchAll(/\d+d\d+/g)]
      const result = listOfNotations(notation, matches)

      expect(result).toHaveLength(2)
      expect(result[0]).toBe('1d20-')
      expect(result[1]).toBe('-1d4')
    })

    test('handles three notations', () => {
      const notation = '1d20+2d6+1d4'
      const matches = [...notation.matchAll(/\d+d\d+/g)]
      const result = listOfNotations(notation, matches)

      expect(result).toHaveLength(3)
      expect(result[0]).toBe('1d20+')
      expect(result[1]).toBe('+2d6+')
      expect(result[2]).toBe('+1d4')
    })
  })

  describe('edge cases', () => {
    test('handles empty matches array', () => {
      const result = listOfNotations('no dice here', [])

      expect(result).toEqual([])
    })

    test('handles match with undefined index', () => {
      // Create a mock match array with undefined index
      const fakeMatch = ['2d6'] as RegExpMatchArray
      fakeMatch.index = undefined
      const result = listOfNotations('2d6', [fakeMatch])

      expect(result).toEqual([])
    })

    test('handles notation with spaces', () => {
      const notation = '1d20 + 2d6'
      const matches = [...notation.matchAll(/\d+d\d+/g)]
      const result = listOfNotations(notation, matches)

      expect(result).toHaveLength(2)
      // Spaces are preserved, split at arithmetic
      expect(result[0]).toBe('1d20 +')
      expect(result[1]).toBe('+ 2d6')
    })

    test('handles notation without arithmetic between matches', () => {
      // This tests the branch where no arithmetic symbol is found
      const notation = '2d6L3d8'
      const matches = [...notation.matchAll(/\d+d\d+/g)]
      const result = listOfNotations(notation, matches)

      expect(result).toHaveLength(2)
    })
  })
})
