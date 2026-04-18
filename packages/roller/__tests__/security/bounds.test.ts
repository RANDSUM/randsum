import { describe, expect, test } from 'bun:test'

import { roll } from '../../src/roll'
import { RandsumError, ValidationError } from '../../src/errors'
import { MAX_QUANTITY, MAX_SIDES } from '../../src/lib/utils/validation'

describe('security: quantity/sides bounds', () => {
  describe('options path', () => {
    test(`quantity at MAX_QUANTITY (${MAX_QUANTITY}) is permitted`, () => {
      expect(() => roll({ quantity: MAX_QUANTITY, sides: 2 })).not.toThrow()
    })

    test('quantity above MAX_QUANTITY throws ValidationError with attempted + cap', () => {
      const attempted = MAX_QUANTITY + 1
      try {
        roll({ quantity: attempted, sides: 6 })
        throw new Error('expected throw')
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError)
        expect(e).toBeInstanceOf(RandsumError)
        const err = e as ValidationError
        expect(err.message).toContain(String(attempted))
        expect(err.message).toContain(String(MAX_QUANTITY))
      }
    })

    test('sides above MAX_SIDES throws ValidationError with attempted + cap', () => {
      const attempted = MAX_SIDES + 1
      try {
        roll({ quantity: 1, sides: attempted })
        throw new Error('expected throw')
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError)
        const err = e as ValidationError
        expect(err.message).toContain(String(attempted))
        expect(err.message).toContain(String(MAX_SIDES))
      }
    })

    test('roll(number) above MAX_SIDES throws', () => {
      expect(() => roll(MAX_SIDES + 1)).toThrow(ValidationError)
    })
  })

  describe('notation path', () => {
    test('roll("999999d20") is permitted when quantity <= MAX_QUANTITY and sides <= MAX_SIDES', () => {
      // 999999 > MAX_QUANTITY (10_000) — should reject
      expect(() => roll('999999d20' as string)).toThrow(ValidationError)
    })

    test('notation quantity above MAX_QUANTITY throws with attempted + cap', () => {
      const attempted = MAX_QUANTITY + 1
      try {
        roll(`${attempted}d20` as string)
        throw new Error('expected throw')
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError)
        const err = e as ValidationError
        expect(err.message).toContain(String(attempted))
        expect(err.message).toContain(String(MAX_QUANTITY))
      }
    })

    test('notation sides above MAX_SIDES throws with attempted + cap', () => {
      const attempted = MAX_SIDES + 1
      try {
        roll(`1d${attempted}` as string)
        throw new Error('expected throw')
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError)
        const err = e as ValidationError
        expect(err.message).toContain(String(attempted))
        expect(err.message).toContain(String(MAX_SIDES))
      }
    })
  })
})
