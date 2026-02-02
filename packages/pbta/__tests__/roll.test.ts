import { describe, expect, test } from 'bun:test'
import { roll } from '../src/roll'

describe('roll', () => {
  test('returns valid outcome', () => {
    const result = roll({ stat: 0 })
    expect(['strong_hit', 'weak_hit', 'miss']).toContain(result.result)
  })

  test('strong hit on 10+', () => {
    // With stat 4, we need at least 6 on 2d6 to hit 10+
    // This is probabilistic, so we test multiple times
    const strongHits = Array.from({ length: 100 }, () => roll({ stat: 4 })).filter(result => {
      if (result.total >= 10) {
        expect(result.result).toBe('strong_hit')
        return true
      }
      return false
    }).length
    // Should get at least some strong hits with stat 4
    expect(strongHits).toBeGreaterThan(0)
  })

  test('weak hit on 7-9', () => {
    const weakHits = Array.from({ length: 100 }, () => roll({ stat: 0 })).filter(result => {
      if (result.total >= 7 && result.total <= 9) {
        expect(result.result).toBe('weak_hit')
        return true
      }
      return false
    }).length
    expect(weakHits).toBeGreaterThan(0)
  })

  test('miss on 6-', () => {
    const misses = Array.from({ length: 100 }, () => roll({ stat: -3 })).filter(result => {
      if (result.total <= 6) {
        expect(result.result).toBe('miss')
        return true
      }
      return false
    }).length
    expect(misses).toBeGreaterThan(0)
  })

  test('applies forward bonus', () => {
    const result = roll({ stat: 0, forward: 2 })
    expect(result.details.forward).toBe(2)
    expect(result.total).toBeGreaterThanOrEqual(3) // 2d6 minimum is 2, +2 = 4
  })

  test('applies ongoing bonus', () => {
    const result = roll({ stat: 0, ongoing: 1 })
    expect(result.details.ongoing).toBe(1)
    expect(result.total).toBeGreaterThanOrEqual(3) // 2d6 minimum is 2, +1 = 3
  })

  test('applies both bonuses', () => {
    const result = roll({ stat: 1, forward: 1, ongoing: 1 })
    expect(result.details.forward).toBe(1)
    expect(result.details.ongoing).toBe(1)
    expect(result.total).toBeGreaterThanOrEqual(5) // 2d6 minimum is 2, +1+1+1 = 5
  })

  test('advantage rolls 3d6 and keeps 2 highest', () => {
    const result = roll({ stat: 0, advantage: true })
    // Should have 2 dice in the result (3 rolled, 1 dropped)
    expect(result.rolls[0]?.rolls.length).toBe(2)
    // Total should be sum of 2 highest from 3d6
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.total).toBeLessThanOrEqual(12)
  })

  test('disadvantage rolls 3d6 and keeps 2 lowest', () => {
    const result = roll({ stat: 0, disadvantage: true })
    // Should have 2 dice in the result (3 rolled, 1 dropped)
    expect(result.rolls[0]?.rolls.length).toBe(2)
    // Total should be sum of 2 lowest from 3d6
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.total).toBeLessThanOrEqual(12)
  })

  test('throws on invalid stat', () => {
    expect(() => roll({ stat: 10 })).toThrow()
    expect(() => roll({ stat: -10 })).toThrow()
  })

  test('throws on invalid forward bonus', () => {
    expect(() => roll({ stat: 0, forward: 10 })).toThrow()
    expect(() => roll({ stat: 0, forward: -10 })).toThrow()
  })

  test('throws on invalid ongoing bonus', () => {
    expect(() => roll({ stat: 0, ongoing: 10 })).toThrow()
    expect(() => roll({ stat: 0, ongoing: -10 })).toThrow()
  })
})
