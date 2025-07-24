import { describe, expect, test } from 'bun:test'
import { notationToOptions } from '../../src/lib/notation'

describe('notationToOptions', () => {
  describe('basic dice notation', () => {
    test('parses simple dice notation', () => {
      const [result] = notationToOptions('1d6')

      expect(result?.quantity).toBe(1)
      expect(result?.sides).toBe(6)
    })

    test('parses multiple dice notation', () => {
      const [result] = notationToOptions('4d8')

      expect(result?.quantity).toBe(4)
      expect(result?.sides).toBe(8)
    })

    test('parses uppercase notation', () => {
      const [result] = notationToOptions('2D20')

      expect(result?.quantity).toBe(2)
      expect(result?.sides).toBe(20)
    })

    test('parses large numbers', () => {
      const [result] = notationToOptions('999d100')

      expect(result?.quantity).toBe(999)
      expect(result?.sides).toBe(100)
    })

    test('parses zero values', () => {
      const [result] = notationToOptions('0d0')

      expect(result?.quantity).toBe(0)
      expect(result?.sides).toBe(0)
    })
  })

  describe('arithmetic modifiers', () => {
    test('parses plus modifier', () => {
      const [result] = notationToOptions('2d6+3')

      expect(result?.quantity).toBe(2)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.plus).toBe(3)
    })

    test('parses minus modifier', () => {
      const [result] = notationToOptions('3d8-2')

      expect(result?.quantity).toBe(3)
      expect(result?.sides).toBe(8)
      expect(result?.modifiers?.minus).toBe(2)
    })

    test('parses multiple arithmetic modifiers', () => {
      const [result] = notationToOptions('1d20+5-2+1')

      expect(result?.quantity).toBe(1)
      expect(result?.sides).toBe(20)
      expect(result?.modifiers?.plus).toBe(6) // 5 + 1
      expect(result?.modifiers?.minus).toBe(2)
    })

    test('parses large arithmetic values', () => {
      const [result] = notationToOptions('1d6+100-50')

      expect(result?.quantity).toBe(1)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.plus).toBe(100)
      expect(result?.modifiers?.minus).toBe(50)
    })
  })

  describe('drop modifiers', () => {
    test('parses drop lowest', () => {
      const [result] = notationToOptions('4d6L')

      expect(result?.quantity).toBe(4)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.drop?.lowest).toBe(1)
    })

    test('parses drop highest', () => {
      const [result] = notationToOptions('2d20H')

      expect(result?.quantity).toBe(2)
      expect(result?.sides).toBe(20)
      expect(result?.modifiers?.drop?.highest).toBe(1)
    })

    test('parses drop lowest with count', () => {
      const [result] = notationToOptions('5d6L2')

      expect(result?.quantity).toBe(5)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.drop?.lowest).toBe(2)
    })

    test('parses drop highest with count', () => {
      const [result] = notationToOptions('3d20H1')

      expect(result?.quantity).toBe(3)
      expect(result?.sides).toBe(20)
      expect(result?.modifiers?.drop?.highest).toBe(1)
    })

    test('parses both drop lowest and highest', () => {
      const [result] = notationToOptions('6d6LH')

      expect(result?.quantity).toBe(6)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.drop?.lowest).toBe(1)
      expect(result?.modifiers?.drop?.highest).toBe(1)
    })
  })

  describe('exploding dice', () => {
    test('parses basic exploding dice', () => {
      const [result] = notationToOptions('3d6!')

      expect(result?.quantity).toBe(3)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.explode).toBe(true)
    })

    test('parses exploding dice with other modifiers', () => {
      const [result] = notationToOptions('2d8!+2')

      expect(result?.quantity).toBe(2)
      expect(result?.sides).toBe(8)
      expect(result?.modifiers?.explode).toBe(true)
      expect(result?.modifiers?.plus).toBe(2)
    })
  })

  describe('reroll modifiers', () => {
    test('parses reroll exact values', () => {
      const [result] = notationToOptions('4d6R{1}')

      expect(result?.quantity).toBe(4)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.reroll?.exact).toContain(1)
    })

    test('parses reroll multiple exact values', () => {
      const [result] = notationToOptions('3d8R{1,2}')

      expect(result?.quantity).toBe(3)
      expect(result?.sides).toBe(8)
      expect(result?.modifiers?.reroll?.exact).toContain(1)
      expect(result?.modifiers?.reroll?.exact).toContain(2)
    })

    test('parses reroll less than', () => {
      const [result] = notationToOptions('2d10R{<3}')

      expect(result?.quantity).toBe(2)
      expect(result?.sides).toBe(10)
      expect(result?.modifiers?.reroll?.lessThan).toBe(3)
    })

    test('parses reroll greater than', () => {
      const [result] = notationToOptions('1d20R{>18}')

      expect(result?.quantity).toBe(1)
      expect(result?.sides).toBe(20)
      expect(result?.modifiers?.reroll?.greaterThan).toBe(18)
    })
  })

  describe('unique modifier', () => {
    test('parses basic unique modifier', () => {
      const [result] = notationToOptions('5d20U')

      expect(result?.quantity).toBe(5)
      expect(result?.sides).toBe(20)
      expect(result?.modifiers?.unique).toBe(true)
    })

    test('parses unique with not-unique values', () => {
      const [result] = notationToOptions('4d6U{1}')

      expect(result?.quantity).toBe(4)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.unique).toEqual({ notUnique: [1] })
    })

    test('parses unique with multiple not-unique values', () => {
      const [result] = notationToOptions('3d8U{1,2}')

      expect(result?.quantity).toBe(3)
      expect(result?.sides).toBe(8)
      expect(result?.modifiers?.unique).toEqual({ notUnique: [1, 2] })
    })
  })

  describe('cap modifiers', () => {
    test('parses cap greater than', () => {
      const [result] = notationToOptions('4d20C{>18}')

      expect(result?.quantity).toBe(4)
      expect(result?.sides).toBe(20)
      expect(result?.modifiers?.cap?.greaterThan).toBe(18)
    })

    test('parses cap less than', () => {
      const [result] = notationToOptions('3d6C{<2}')

      expect(result?.quantity).toBe(3)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.cap?.lessThan).toBe(2)
    })

    test('parses cap with multiple conditions', () => {
      const [result] = notationToOptions('2d10C{<3,>8}')

      expect(result?.quantity).toBe(2)
      expect(result?.sides).toBe(10)
      expect(result?.modifiers?.cap?.lessThan).toBe(3)
      expect(result?.modifiers?.cap?.greaterThan).toBe(8)
    })
  })

  describe('replace modifiers', () => {
    test('parses basic replace modifier', () => {
      const [result] = notationToOptions('3d6V{1=6}')

      expect(result?.quantity).toBe(3)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.replace).toEqual([{ from: 1, to: 6 }])
    })

    test('parses multiple replace values', () => {
      const [result] = notationToOptions('2d8V{1=8,2=7}')

      expect(result?.quantity).toBe(2)
      expect(result?.sides).toBe(8)
      expect(result?.modifiers?.replace).toEqual([
        { from: 1, to: 8 },
        { from: 2, to: 7 }
      ])
    })
  })

  describe('complex combinations', () => {
    test('parses multiple modifiers together', () => {
      const [result] = notationToOptions('4d6LR{1}!+3')

      expect(result?.quantity).toBe(4)
      expect(result?.sides).toBe(6)
      expect(result?.modifiers?.drop?.lowest).toBe(1)
      expect(result?.modifiers?.reroll?.exact).toContain(1)
      expect(result?.modifiers?.explode).toBe(true)
      expect(result?.modifiers?.plus).toBe(3)
    })

    test('parses very complex notation', () => {
      const [result] = notationToOptions('6d8L2H1R{1,2}U!C{>7}+5-2')

      expect(result?.quantity).toBe(6)
      expect(result?.sides).toBe(8)
      expect(result?.modifiers?.drop?.lowest).toBe(2)
      expect(result?.modifiers?.drop?.highest).toBe(1)
      expect(result?.modifiers?.reroll?.exact).toContain(1)
      expect(result?.modifiers?.reroll?.exact).toContain(2)
      expect(result?.modifiers?.unique).toBe(true)
      expect(result?.modifiers?.explode).toBe(true)
      expect(result?.modifiers?.cap?.greaterThan).toBe(7)
      expect(result?.modifiers?.plus).toBe(5)
      expect(result?.modifiers?.minus).toBe(2)
    })
  })

  describe('edge cases', () => {
    test('handles notation with no modifiers', () => {
      const [result] = notationToOptions('1d1')

      expect(result?.quantity).toBe(1)
      expect(result?.sides).toBe(1)
    })

    test('handles single character dice', () => {
      const [result] = notationToOptions('1d2')

      expect(result?.quantity).toBe(1)
      expect(result?.sides).toBe(2)
    })

    test('handles very large dice', () => {
      const [result] = notationToOptions('1d1000')

      expect(result?.quantity).toBe(1)
      expect(result?.sides).toBe(1000)
    })
  })

  describe('corner case', () => {
    test('handles complex multi-dice notation', () => {
      const results = notationToOptions('3d20!H+2D6U')
      expect(results.length).toBe(2)
    })
  })

  describe('return type validation', () => {
    test('returns proper RollOptions structure', () => {
      const [result] = notationToOptions('2d6+1')

      expect(typeof result?.quantity).toBe('number')
      expect(typeof result?.sides).toBe('number')

      expect(result).toHaveProperty('quantity')
      expect(result).toHaveProperty('sides')
    })

    test('modifiers object has correct structure when present', () => {
      const [result] = notationToOptions('4d6LR{1}!+3')

      if (result?.modifiers) {
        expect(typeof result.modifiers).toBe('object')

        if (result.modifiers.drop) {
          expect(typeof result.modifiers.drop).toBe('object')
        }

        if (result.modifiers.reroll) {
          expect(typeof result.modifiers.reroll).toBe('object')
        }

        if (result.modifiers.plus !== undefined) {
          expect(typeof result.modifiers.plus).toBe('number')
        }

        if (result.modifiers.explode !== undefined) {
          expect(typeof result.modifiers.explode).toBe('boolean')
        }
      }
    })
  })
})
