import { describe, expect, test } from 'bun:test'
import { ArithmeticModifier } from '../../../src/lib/modifiers/ArithmeticModifier'
import { createNumericRollBonus } from '../../support/fixtures'

class TestArithmeticModifier extends ArithmeticModifier {
  protected readonly operator = '+' as const
  protected readonly operatorName = 'plus' as const
  protected readonly actionVerb = 'Add' as const

  public static testParseArithmetic(
    modifiersString: string,
    pattern: RegExp,
    operator: '+' | '-'
  ): number {
    return this.parseArithmetic(modifiersString, pattern, operator)
  }
}

describe('ArithmeticModifier', () => {
  describe('static parseArithmetic', () => {
    test('parses single arithmetic modifier', () => {
      const result = TestArithmeticModifier.testParseArithmetic(
        '+5',
        /\+\d+/g,
        '+'
      )
      expect(result).toBe(5)
    })

    test('parses multiple arithmetic modifiers', () => {
      const result = TestArithmeticModifier.testParseArithmetic(
        '+3+7+2',
        /\+\d+/g,
        '+'
      )
      expect(result).toBe(12)
    })

    test('parses minus modifiers', () => {
      const result = TestArithmeticModifier.testParseArithmetic(
        '-5-3',
        /-\d+/g,
        '-'
      )
      expect(result).toBe(8)
    })

    test('returns 0 when no matches found', () => {
      const result = TestArithmeticModifier.testParseArithmetic(
        '2d6',
        /\+\d+/g,
        '+'
      )
      expect(result).toBe(0)
    })

    test('handles complex notation with mixed modifiers', () => {
      const result = TestArithmeticModifier.testParseArithmetic(
        '4d6L+3+2-1+5',
        /\+\d+/g,
        '+'
      )
      expect(result).toBe(10)
    })

    test('handles large numbers', () => {
      const result = TestArithmeticModifier.testParseArithmetic(
        '+100+250',
        /\+\d+/g,
        '+'
      )
      expect(result).toBe(350)
    })

    test('handles zero values', () => {
      const result = TestArithmeticModifier.testParseArithmetic(
        '+0+5',
        /\+\d+/g,
        '+'
      )
      expect(result).toBe(5)
    })
  })

  describe('apply', () => {
    test('applies positive modifier correctly', () => {
      const modifier = new TestArithmeticModifier(5)
      const bonus = createNumericRollBonus({
        rolls: [3, 4, 2]
      })

      const result = modifier.apply(bonus)

      expect(result.rolls).toEqual([3, 4, 2])
      expect(result.simpleMathModifier).toBe(5)
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'plus',
        options: 5,
        added: [5],
        removed: []
      })
    })

    test('applies negative modifier correctly', () => {
      class TestMinusModifier extends ArithmeticModifier {
        protected readonly operator = '-' as const
        protected readonly operatorName = 'minus' as const
        protected readonly actionVerb = 'Subtract' as const
      }

      const modifier = new TestMinusModifier(3)
      const bonus = createNumericRollBonus({
        rolls: [6, 4]
      })

      const result = modifier.apply(bonus)

      expect(result.rolls).toEqual([6, 4])
      expect(result.simpleMathModifier).toBe(-3)
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'minus',
        options: 3,
        added: [-3],
        removed: []
      })
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new TestArithmeticModifier(undefined)
      const bonus = createNumericRollBonus({
        rolls: [1, 2, 3]
      })

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })

    test('preserves existing logs', () => {
      const modifier = new TestArithmeticModifier(2)
      const existingLog = {
        modifier: 'drop',
        options: { lowest: 1 },
        added: [],
        removed: [1]
      }
      const bonus = createNumericRollBonus({
        rolls: [4, 5],
        logs: [existingLog]
      })

      const result = modifier.apply(bonus)

      expect(result.logs).toHaveLength(2)
      expect(result.logs[0]).toBe(existingLog)
      expect(result.logs[1]).toMatchObject({
        modifier: 'plus',
        options: 2,
        added: [2],
        removed: []
      })
    })
  })

  describe('toDescription', () => {
    test('returns correct description for positive modifier', () => {
      const modifier = new TestArithmeticModifier(7)
      const description = modifier.toDescription()

      expect(description).toEqual(['Add 7'])
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new TestArithmeticModifier(undefined)
      const description = modifier.toDescription()

      expect(description).toBeUndefined()
    })

    test('returns correct description for subtract modifier', () => {
      class TestMinusModifier extends ArithmeticModifier {
        protected readonly operator = '-' as const
        protected readonly operatorName = 'minus' as const
        protected readonly actionVerb = 'Subtract' as const
      }

      const modifier = new TestMinusModifier(4)
      const description = modifier.toDescription()

      expect(description).toEqual(['Subtract 4'])
    })
  })

  describe('toNotation', () => {
    test('returns correct notation for positive modifier', () => {
      const modifier = new TestArithmeticModifier(8)
      const notation = modifier.toNotation()

      expect(notation).toBe('+8')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new TestArithmeticModifier(undefined)
      const notation = modifier.toNotation()

      expect(notation).toBeUndefined()
    })

    test('handles negative values for plus modifier', () => {
      const modifier = new TestArithmeticModifier(-5)
      const notation = modifier.toNotation()

      expect(notation).toBe('-5')
    })

    test('returns correct notation for minus modifier', () => {
      class TestMinusModifier extends ArithmeticModifier {
        protected readonly operator = '-' as const
        protected readonly operatorName = 'minus' as const
        protected readonly actionVerb = 'Subtract' as const
      }

      const modifier = new TestMinusModifier(3)
      const notation = modifier.toNotation()

      expect(notation).toBe('-3')
    })

    test('handles zero values', () => {
      const modifier = new TestArithmeticModifier(0)
      const notation = modifier.toNotation()

      expect(notation).toBe('+0')
    })
  })
})
