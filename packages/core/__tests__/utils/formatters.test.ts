import { describe, expect, test } from 'bun:test'
import { formatters } from '../../src/utils/formatters'

describe('formatters', () => {
  describe('humanList', () => {
    test('formats a single item', () => {
      const result = formatters.humanList([5])
      expect(result).toBe('[5]')
    })

    test('formats two items', () => {
      const result = formatters.humanList([1, 2])
      expect(result).toBe('[1] and [2]')
    })

    test('formats multiple items', () => {
      const result = formatters.humanList([1, 2, 3])
      expect(result).toBe('[1] [2] and [3]')
    })

    test('handles string values', () => {
      const result = formatters.humanList(['Tahu', 'Gali', 'Lewa'])
      expect(result).toBe('[Tahu] [Gali] and [Lewa]')
    })

    test('handles mixed values', () => {
      const result = formatters.humanList([1, 'two', 3])
      expect(result).toBe('[1] [two] and [3]')
    })
  })

  describe('greaterLess', () => {
    describe('descriptions', () => {
      test('formats greaterThan option', () => {
        const result = formatters.greaterLess.descriptions({ greaterThan: 18 })
        expect(result).toEqual(['greater than [18]'])
      })

      test('formats lessThan option', () => {
        const result = formatters.greaterLess.descriptions({ lessThan: 5 })
        expect(result).toEqual(['less than [5]'])
      })

      test('formats both options', () => {
        const result = formatters.greaterLess.descriptions({
          greaterThan: 15,
          lessThan: 5
        })
        expect(result).toEqual(['greater than [15]', 'less than [5]'])
      })

      test('appends to existing list', () => {
        const existingList = ['existing item']
        const result = formatters.greaterLess.descriptions(
          { greaterThan: 10 },
          existingList
        )
        expect(result).toEqual(['existing item', 'greater than [10]'])
      })
    })

    describe('notation', () => {
      test('formats greaterThan option', () => {
        const result = formatters.greaterLess.notation({ greaterThan: 18 })
        expect(result).toEqual(['>18'])
      })

      test('formats lessThan option', () => {
        const result = formatters.greaterLess.notation({ lessThan: 5 })
        expect(result).toEqual(['<5'])
      })

      test('formats both options', () => {
        const result = formatters.greaterLess.notation({
          greaterThan: 15,
          lessThan: 5
        })
        expect(result).toEqual(['>15', '<5'])
      })

      test('appends to existing list', () => {
        const existingList = ['existing item']
        const result = formatters.greaterLess.notation(
          { lessThan: 3 },
          existingList
        )
        expect(result).toEqual(['existing item', '<3'])
      })
    })
  })
})
