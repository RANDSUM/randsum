import { describe, expect, test } from 'bun:test'
import { roll } from '../../../src/roll'
import { ModifierError } from '../../../src/errors'

describe('countSuccesses modifier', () => {
  describe('botchThreshold validation', () => {
    test('throws ModifierError when botchThreshold equals threshold', () => {
      expect(() =>
        roll({
          sides: 10,
          quantity: 5,
          modifiers: { countSuccesses: { threshold: 5, botchThreshold: 5 } }
        })
      ).toThrow(ModifierError)
    })

    test('throws ModifierError when botchThreshold is greater than threshold', () => {
      expect(() =>
        roll({
          sides: 10,
          quantity: 5,
          modifiers: { countSuccesses: { threshold: 5, botchThreshold: 6 } }
        })
      ).toThrow(ModifierError)
    })

    test('succeeds when botchThreshold is less than threshold', () => {
      expect(() =>
        roll({
          sides: 10,
          quantity: 5,
          modifiers: { countSuccesses: { threshold: 7, botchThreshold: 1 } }
        })
      ).not.toThrow()
    })

    test('succeeds when botchThreshold is not provided', () => {
      expect(() =>
        roll({ sides: 10, quantity: 5, modifiers: { countSuccesses: { threshold: 5 } } })
      ).not.toThrow()
    })
  })
})
