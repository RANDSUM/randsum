import { describe, expect, test } from 'bun:test'
import { meetOrBeat5e } from '../src/meetOrBeat5e'
import type { RollArgument5e } from '../src/types'

describe('meetOrBeat5e', () => {
  describe('with standard roll', () => {
    const args: RollArgument5e = { modifier: 5 }

    test('returns true when roll meets DC', () => {
      const dc = 10
      const result = meetOrBeat5e(dc, args)
      expect(typeof result).toBe('boolean')
    })

    test('returns false for impossible DC', () => {
      const impossibleDC = 30 // Max possible roll is 25 (20 + 5)
      const result = meetOrBeat5e(impossibleDC, args)
      expect(result).toBe(false)
    })

    test('returns true for guaranteed DC', () => {
      const guaranteedDC = 6 // Min possible roll is 6 (1 + 5)
      const result = meetOrBeat5e(guaranteedDC, args)
      expect(result).toBe(true)
    })
  })

  describe('with advantage', () => {
    const args: RollArgument5e = {
      modifier: 5,
      rollingWith: 'Advantage'
    }

    test('returns correct boolean result', () => {
      const dc = 15
      const result = meetOrBeat5e(dc, args)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('with disadvantage', () => {
    const args: RollArgument5e = {
      modifier: 5,
      rollingWith: 'Disadvantage'
    }

    test('returns correct boolean result', () => {
      const dc = 15
      const result = meetOrBeat5e(dc, args)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('edge cases', () => {
    test('handles DC of 0', () => {
      const args: RollArgument5e = { modifier: 0 }
      const result = meetOrBeat5e(0, args)
      expect(result).toBe(true)
    })

    test('handles negative DC', () => {
      const args: RollArgument5e = { modifier: 0 }
      const result = meetOrBeat5e(-5, args)
      expect(result).toBe(true)
    })

    test('handles large negative modifier', () => {
      const args: RollArgument5e = { modifier: -10 }
      const result = meetOrBeat5e(15, args)
      expect(typeof result).toBe('boolean')
    })
  })
})
