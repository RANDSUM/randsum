import { describe, expect, test } from 'bun:test'
import { modifiersOf } from '../support/modifiersOf'

/**
 * Every modifier schema parses its own lexer tokens into options.
 */
describe('notationToOptions — modifier schemas', () => {
  describe('modifiersOf', () => {
    test('parses drop modifier notation', () => {
      const result = modifiersOf('4d6L')
      expect(result.drop).toEqual({ lowest: 1 })
    })

    test('parses keep modifier notation', () => {
      const result = modifiersOf('4d6K3')
      expect(result.keep).toEqual({ highest: 3 })
    })

    test('parses plus modifier notation', () => {
      const result = modifiersOf('2d6+5')
      expect(result.plus).toBe(5)
    })

    test('parses minus modifier notation', () => {
      const result = modifiersOf('2d6-3')
      expect(result.minus).toBe(3)
    })

    test('parses explode modifier notation', () => {
      const result = modifiersOf('3d6!')
      expect(result.explode).toBe(true)
    })

    test('parses reroll modifier notation', () => {
      const result = modifiersOf('4d6R{1}')
      expect(result.reroll).toBeDefined()
    })

    test('parses unique modifier notation', () => {
      const result = modifiersOf('4d6U')
      expect(result.unique).toBe(true)
    })

    test('parses cap modifier notation', () => {
      const result = modifiersOf('4d6C{<2}')
      expect(result.cap).toBeDefined()
    })

    test('parses count successes sugar notation S{N}', () => {
      const result = modifiersOf('4d6S{5}')
      expect(result.count).toEqual({ greaterThanOrEqual: 5 })
    })

    test('parses count failures sugar notation F{N}', () => {
      const result = modifiersOf('4d6F{2}')
      expect(result.count).toEqual({ lessThanOrEqual: 2 })
    })

    test('parses count notation #{...}', () => {
      const result = modifiersOf('4d6#{>3}')
      expect(result.count).toBeDefined()
    })

    test('parses integer divide modifier', () => {
      const result = modifiersOf('4d6//2')
      expect(result.integerDivide).toBe(2)
    })

    test('parses modulo modifier', () => {
      const result = modifiersOf('4d6%3')
      expect(result.modulo).toBe(3)
    })

    test('parses sort modifier ascending', () => {
      const result = modifiersOf('4d6sa')
      expect(result.sort).toBe('asc')
    })

    test('parses wildDie modifier', () => {
      const result = modifiersOf('5d6W')
      expect(result.wildDie).toBe(true)
    })

    test('returns empty object for notation with no modifiers', () => {
      const result = modifiersOf('4d6')
      expect(result).toEqual({})
    })

    test('parses multiple modifiers in single notation', () => {
      const result = modifiersOf('4d6L+5')
      expect(result.drop).toEqual({ lowest: 1 })
      expect(result.plus).toBe(5)
    })

    test('preprocesses margin-of-success sugar to minus modifier', () => {
      const result = modifiersOf('4d6ms{3}')
      expect(result.minus).toBe(3)
    })
  })
})
