import { describe, expect, test } from 'bun:test'
import { ArithmeticModifier } from '../../../src/lib/modifiers/ArithmeticModifier'
import { createNumericRollBonus } from '../../support/fixtures'

describe('ArithmeticModifier', () => {
  describe('static parsePlus', () => {
    test('parses single plus modifier', () => {
      const result = ArithmeticModifier.parsePlus('1d6+5')
      expect(result).toEqual({ plus: 5 })
    })

    test('parses multiple plus modifiers', () => {
      const result = ArithmeticModifier.parsePlus('2d6+3+7+2')
      expect(result).toEqual({ plus: 12 })
    })

    test('returns empty object when no plus modifiers found', () => {
      const result = ArithmeticModifier.parsePlus('2d6-5')
      expect(result).toEqual({})
    })

    test('handles complex notation with mixed modifiers', () => {
      const result = ArithmeticModifier.parsePlus('4d6L+10-3+5')
      expect(result).toEqual({ plus: 15 })
    })

    test('handles large plus values', () => {
      const result = ArithmeticModifier.parsePlus('1d20+100+250')
      expect(result).toEqual({ plus: 350 })
    })

    test('handles zero plus values', () => {
      const result = ArithmeticModifier.parsePlus('2d6+0+5')
      expect(result).toEqual({ plus: 5 })
    })
  })

  describe('static parseMinus', () => {
    test('parses single minus modifier', () => {
      const result = ArithmeticModifier.parseMinus('1d6-3')
      expect(result).toEqual({ minus: 3 })
    })

    test('parses multiple minus modifiers', () => {
      const result = ArithmeticModifier.parseMinus('2d6-2-4-1')
      expect(result).toEqual({ minus: 7 })
    })

    test('returns empty object when no minus modifiers found', () => {
      const result = ArithmeticModifier.parseMinus('2d6+5')
      expect(result).toEqual({})
    })

    test('handles complex notation with mixed modifiers', () => {
      const result = ArithmeticModifier.parseMinus('4d6L+10-3-5')
      expect(result).toEqual({ minus: 8 })
    })

    test('handles large minus values', () => {
      const result = ArithmeticModifier.parseMinus('1d20-50-25')
      expect(result).toEqual({ minus: 75 })
    })

    test('handles zero minus values', () => {
      const result = ArithmeticModifier.parseMinus('2d6-0-3')
      expect(result).toEqual({ minus: 3 })
    })
  })

  describe('static createPlus', () => {
    test('creates plus modifier instance', () => {
      const modifier = ArithmeticModifier.createPlus(5)
      expect(modifier).toBeInstanceOf(ArithmeticModifier)
      expect(modifier.toNotation()).toBe('+5')
      expect(modifier.toDescription()).toEqual(['Add 5'])
    })

    test('creates plus modifier with undefined value', () => {
      const modifier = ArithmeticModifier.createPlus(undefined)
      expect(modifier).toBeInstanceOf(ArithmeticModifier)
      expect(modifier.toNotation()).toBe('')
      expect(modifier.toDescription()).toEqual([])
    })

    test('creates plus modifier with zero value', () => {
      const modifier = ArithmeticModifier.createPlus(0)
      expect(modifier).toBeInstanceOf(ArithmeticModifier)
      expect(modifier.toNotation()).toBe('')
      expect(modifier.toDescription()).toEqual([])
    })

    test('plus modifier applies correctly', () => {
      const modifier = ArithmeticModifier.createPlus(7)
      const bonus = createNumericRollBonus({ rolls: [3, 4] })
      const result = modifier.apply(bonus)

      expect(result.simpleMathModifier).toBe(7)
      expect(result.logs[0]).toMatchObject({
        modifier: 'plus',
        options: 7,
        added: [7],
        removed: []
      })
    })
  })

  describe('static createMinus', () => {
    test('creates minus modifier instance', () => {
      const modifier = ArithmeticModifier.createMinus(3)
      expect(modifier).toBeInstanceOf(ArithmeticModifier)
      expect(modifier.toNotation()).toBe('-3')
      expect(modifier.toDescription()).toEqual(['Subtract 3'])
    })

    test('creates minus modifier with undefined value', () => {
      const modifier = ArithmeticModifier.createMinus(undefined)
      expect(modifier).toBeInstanceOf(ArithmeticModifier)
      expect(modifier.toNotation()).toEqual('')
      expect(modifier.toDescription()).toEqual([])
    })

    test('creates minus modifier with zero value', () => {
      const modifier = ArithmeticModifier.createMinus(0)
      expect(modifier).toBeInstanceOf(ArithmeticModifier)
      expect(modifier.toNotation()).toEqual('')
      expect(modifier.toDescription()).toEqual([])
    })

    test('minus modifier applies correctly', () => {
      const modifier = ArithmeticModifier.createMinus(4)
      const bonus = createNumericRollBonus({ rolls: [6, 5] })
      const result = modifier.apply(bonus)

      expect(result.simpleMathModifier).toBe(-4)
      expect(result.logs[0]).toMatchObject({
        modifier: 'minus',
        options: 4,
        added: [-4],
        removed: []
      })
    })
  })

  describe('constructor with operator parameter', () => {
    test('creates plus modifier with constructor', () => {
      const modifier = new ArithmeticModifier(8, '+')
      expect(modifier.toNotation()).toBe('+8')
      expect(modifier.toDescription()).toEqual(['Add 8'])
    })

    test('creates minus modifier with constructor', () => {
      const modifier = new ArithmeticModifier(6, '-')
      expect(modifier.toNotation()).toBe('-6')
      expect(modifier.toDescription()).toEqual(['Subtract 6'])
    })

    test('constructor with undefined value', () => {
      const modifier = new ArithmeticModifier(undefined, '+')
      expect(modifier.toNotation()).toEqual('')
      expect(modifier.toDescription()).toEqual([])
    })
  })
})
