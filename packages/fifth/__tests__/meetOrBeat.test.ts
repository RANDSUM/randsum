import { describe, expect, test } from 'bun:test'
import { meetOrBeat } from '../src/meetOrBeat'
import type { RollArgument } from '../src/types'

describe(meetOrBeat, () => {
  describe('with standard roll', () => {
    const args: RollArgument = { modifier: 5 }

    test('returns true when roll meets DC', () => {
      const dc = 10
      const result = meetOrBeat(dc, args)
      expect(typeof result).toBe('boolean')
    })

    test('returns false for impossible DC', () => {
      const impossibleDC = 30
      const result = meetOrBeat(impossibleDC, args)
      expect(result).toBe(false)
    })

    test('returns true for guaranteed DC', () => {
      const guaranteedDC = 6
      const result = meetOrBeat(guaranteedDC, args)
      expect(result).toBe(true)
    })
  })

  describe('with advantage', () => {
    const args: RollArgument = {
      modifier: 5,
      rollingWith: 'Advantage'
    }

    test('returns correct boolean result', () => {
      const dc = 15
      const result = meetOrBeat(dc, args)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('with disadvantage', () => {
    const args: RollArgument = {
      modifier: 5,
      rollingWith: 'Disadvantage'
    }

    test('returns correct boolean result', () => {
      const dc = 15
      const result = meetOrBeat(dc, args)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('edge cases', () => {
    test('handles DC of 0', () => {
      const args: RollArgument = { modifier: 0 }
      const result = meetOrBeat(0, args)
      expect(result).toBe(true)
    })

    test('handles negative DC', () => {
      const args: RollArgument = { modifier: 0 }
      const result = meetOrBeat(-5, args)
      expect(result).toBe(true)
    })

    test('handles large negative modifier', () => {
      const args: RollArgument = { modifier: -10 }
      const result = meetOrBeat(15, args)
      expect(typeof result).toBe('boolean')
    })
  })
})
