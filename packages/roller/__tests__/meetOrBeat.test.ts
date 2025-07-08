import { describe, expect, test } from 'bun:test'
import { meetOrBeat } from '../src'

describe(meetOrBeat, () => {
  describe('with standard roll', () => {
    test('returns true when roll meets total', () => {
      const total = 1
      const [result] = meetOrBeat(total, '1d1')
      expect(result).toBe(true)
    })

    test('returns false for impossible total', () => {
      const impossibleTotal = 21
      const [result] = meetOrBeat(impossibleTotal, '1d20')
      expect(result).toBe(false)
    })

    test('returns true for guaranteed total', () => {
      const guaranteedTotal = 6
      const [result] = meetOrBeat(guaranteedTotal, '6d20')
      expect(result).toBe(true)
    })
  })
})
