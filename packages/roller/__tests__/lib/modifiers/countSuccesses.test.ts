import { describe, expect, test } from 'bun:test'
import { roll } from '../../../src/roll'

describe('count modifier validation (via options)', () => {
  describe('deduct with overlapping ranges', () => {
    test('succeeds with non-overlapping ranges', () => {
      expect(() =>
        roll({
          sides: 10,
          quantity: 5,
          modifiers: { count: { greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true } }
        })
      ).not.toThrow()
    })

    test('succeeds with count without deduct', () => {
      expect(() =>
        roll({ sides: 10, quantity: 5, modifiers: { count: { greaterThanOrEqual: 5 } } })
      ).not.toThrow()
    })
  })
})
