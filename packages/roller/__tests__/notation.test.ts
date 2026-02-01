import { describe, expect, test } from 'bun:test'
import { notation } from '../src/isDiceNotation'
import { NotationParseError } from '../src/errors'

describe('notation', () => {
  describe('valid notation', () => {
    test('returns branded DiceNotation for valid input', () => {
      const result = notation('2d6')

      expect(result).toBe('2d6')
    })

    test('accepts notation with modifiers', () => {
      expect(notation('4d6L')).toBe('4d6L')
      expect(notation('2d20H')).toBe('2d20H')
      expect(notation('1d20+5')).toBe('1d20+5')
    })

    test('accepts complex notation', () => {
      expect(notation('4d6R{1}L')).toBe('4d6R{1}L')
      expect(notation('3d6!')).toBe('3d6!')
      expect(notation('2d10C{>8}')).toBe('2d10C{>8}')
    })
  })

  describe('invalid notation with suggestions', () => {
    test('throws NotationParseError with suggestion for missing quantity', () => {
      try {
        notation('d6')
        expect.unreachable('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(NotationParseError)
        const error = e as NotationParseError
        expect(error.suggestion).toBe('1d6')
        expect(error.message).toContain('Did you mean "1d6"?')
      }
    })

    test('throws NotationParseError with suggestion for uppercase D', () => {
      try {
        notation('D20')
        expect.unreachable('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(NotationParseError)
        const error = e as NotationParseError
        expect(error.suggestion).toBe('1d20')
      }
    })
  })

  describe('invalid notation without suggestions', () => {
    test('throws NotationParseError without suggestion for garbage input', () => {
      try {
        notation('hello')
        expect.unreachable('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(NotationParseError)
        const error = e as NotationParseError
        expect(error.suggestion).toBeUndefined()
        expect(error.message).not.toContain('Did you mean')
      }
    })

    test('throws for empty string', () => {
      expect(() => notation('')).toThrow(NotationParseError)
    })

    test('throws for whitespace only', () => {
      expect(() => notation('   ')).toThrow(NotationParseError)
    })
  })
})
