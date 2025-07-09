import { describe, expect, test } from 'bun:test'
import { meetOrBeat } from '../src'

describe(meetOrBeat, () => {
  describe('with standard roll', () => {
    test('returns proper fields', () => {
      const total = 2
      const { success, target, result } = meetOrBeat(total, '1d1')
      expect(success).toBe(false)
      expect(target).toBe(total)
      expect(result.parameters.notation).toBe('1d1')
    })

    test('returns true when roll meets total', () => {
      const total = 1
      const { success } = meetOrBeat(total, '1d1')
      expect(success).toBe(true)
    })

    test('returns false for impossible total', () => {
      const impossibleTotal = 21
      const { success } = meetOrBeat(impossibleTotal, '1d20')
      expect(success).toBe(false)
    })

    test('returns true for guaranteed total', () => {
      const guaranteedTotal = 6
      const { success } = meetOrBeat(guaranteedTotal, '6d20')
      expect(success).toBe(true)
    })
  })
})
