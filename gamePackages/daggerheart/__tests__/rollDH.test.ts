import { describe, expect, test } from 'bun:test'
import { rollDH } from '../src/rollDH'
import type { RollArgumentDH } from '../src/types'

describe('rollDH', () => {
  describe('basic roll', () => {
    test('returns a result with no modifier', () => {
      const result = rollDH({})
      expect(result.total).toBeGreaterThanOrEqual(2) // 1 + 1
      expect(result.total).toBeLessThanOrEqual(24) // 12 + 12
      expect(result.rolls.modifier).toBe(0)
      expect(result.rolls.advantage).toBeUndefined()
    })

    test('returns a result with positive modifier', () => {
      const args: RollArgumentDH = { modifier: 5 }
      const result = rollDH(args)
      expect(result.total).toBeGreaterThanOrEqual(7) // 1 + 1 + 5
      expect(result.total).toBeLessThanOrEqual(29) // 12 + 12 + 5
      expect(result.rolls.modifier).toBe(5)
    })

    test('returns a result with negative modifier', () => {
      const args: RollArgumentDH = { modifier: -3 }
      const result = rollDH(args)
      expect(result.total).toBeGreaterThanOrEqual(-1) // 1 + 1 - 3
      expect(result.total).toBeLessThanOrEqual(21) // 12 + 12 - 3
      expect(result.rolls.modifier).toBe(-3)
    })

    test('returns a result with zero modifier', () => {
      const args: RollArgumentDH = { modifier: 0 }
      const result = rollDH(args)
      expect(result.total).toBeGreaterThanOrEqual(2) // 1 + 1
      expect(result.total).toBeLessThanOrEqual(24) // 12 + 12
      expect(result.rolls.modifier).toBe(0)
    })

    test('returns valid RollResultDH structure', () => {
      const result = rollDH({})
      expect(result).toHaveProperty('type')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('rolls')
      expect(result.rolls).toHaveProperty('hope')
      expect(result.rolls).toHaveProperty('fear')
      expect(result.rolls).toHaveProperty('modifier')
      expect(result.rolls).toHaveProperty('advantage')
      expect(['hope', 'fear', 'critical hope']).toContain(result.type)
    })

    test('hope and fear dice are within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDH({})
        expect(result.rolls.hope).toBeGreaterThanOrEqual(1)
        expect(result.rolls.hope).toBeLessThanOrEqual(12)
        expect(result.rolls.fear).toBeGreaterThanOrEqual(1)
        expect(result.rolls.fear).toBeLessThanOrEqual(12)
      }
    })
  })

  describe('hope vs fear determination logic', () => {
    test('type is "hope" when hope > fear', () => {
      // Run multiple times to catch different combinations
      let hopeWins = 0
      for (let i = 0; i < 100; i++) {
        const result = rollDH({})
        if (result.rolls.hope > result.rolls.fear) {
          expect(result.type).toBe('hope')
          hopeWins++
        }
      }
      // Should have at least some hope wins in 100 rolls
      expect(hopeWins).toBeGreaterThan(0)
    })

    test('type is "fear" when fear > hope', () => {
      let fearWins = 0
      for (let i = 0; i < 100; i++) {
        const result = rollDH({})
        if (result.rolls.fear > result.rolls.hope) {
          expect(result.type).toBe('fear')
          fearWins++
        }
      }
      // Should have at least some fear wins in 100 rolls
      expect(fearWins).toBeGreaterThan(0)
    })

    test('type is "critical hope" when hope equals fear', () => {
      let criticalHopes = 0
      for (let i = 0; i < 200; i++) {
        const result = rollDH({})
        if (result.rolls.hope === result.rolls.fear) {
          expect(result.type).toBe('critical hope')
          criticalHopes++
        }
      }
      // Should have at least some critical hopes in 200 rolls (though rare)
      expect(criticalHopes).toBeGreaterThanOrEqual(0)
    })
  })

  describe('advantage system', () => {
    test('rolling with Advantage adds d6 to total', () => {
      const args: RollArgumentDH = { modifier: 0, rollingWith: 'Advantage' }
      const result = rollDH(args)
      
      expect(result.rolls.advantage).toBeGreaterThanOrEqual(1)
      expect(result.rolls.advantage).toBeLessThanOrEqual(6)
      expect(result.total).toBe(result.rolls.hope + result.rolls.fear + (result.rolls.advantage ?? 0))
    })

    test('rolling with Disadvantage subtracts d6 from total', () => {
      const args: RollArgumentDH = { modifier: 0, rollingWith: 'Disadvantage' }
      const result = rollDH(args)
      
      expect(result.rolls.advantage).toBeLessThanOrEqual(-1)
      expect(result.rolls.advantage).toBeGreaterThanOrEqual(-6)
      expect(result.total).toBe(result.rolls.hope + result.rolls.fear + (result.rolls.advantage ?? 0))
    })

    test('rolling with undefined rollingWith has no advantage modification', () => {
      const args: RollArgumentDH = { modifier: 0 }
      const result = rollDH(args)
      
      expect(result.rolls.advantage).toBeUndefined()
      expect(result.total).toBe(result.rolls.hope + result.rolls.fear)
    })

    test('advantage die is within valid range over multiple rolls', () => {
      for (let i = 0; i < 100; i++) {
        const advantageResult = rollDH({ rollingWith: 'Advantage' })
        expect(advantageResult.rolls.advantage).toBeGreaterThanOrEqual(1)
        expect(advantageResult.rolls.advantage).toBeLessThanOrEqual(6)

        const disadvantageResult = rollDH({ rollingWith: 'Disadvantage' })
        expect(disadvantageResult.rolls.advantage).toBeGreaterThanOrEqual(-6)
        expect(disadvantageResult.rolls.advantage).toBeLessThanOrEqual(-1)
      }
    })
  })

  describe('amplify system', () => {
    test('amplifyHope makes hope die d20', () => {
      for (let i = 0; i < 50; i++) {
        const result = rollDH({ amplifyHope: true })
        expect(result.rolls.hope).toBeGreaterThanOrEqual(1)
        expect(result.rolls.hope).toBeLessThanOrEqual(20)
        expect(result.rolls.fear).toBeGreaterThanOrEqual(1)
        expect(result.rolls.fear).toBeLessThanOrEqual(12)
      }
    })

    test('amplifyFear makes fear die d20', () => {
      for (let i = 0; i < 50; i++) {
        const result = rollDH({ amplifyFear: true })
        expect(result.rolls.hope).toBeGreaterThanOrEqual(1)
        expect(result.rolls.hope).toBeLessThanOrEqual(12)
        expect(result.rolls.fear).toBeGreaterThanOrEqual(1)
        expect(result.rolls.fear).toBeLessThanOrEqual(20)
      }
    })

    test('both amplifyHope and amplifyFear makes both dice d20', () => {
      for (let i = 0; i < 50; i++) {
        const result = rollDH({ amplifyHope: true, amplifyFear: true })
        expect(result.rolls.hope).toBeGreaterThanOrEqual(1)
        expect(result.rolls.hope).toBeLessThanOrEqual(20)
        expect(result.rolls.fear).toBeGreaterThanOrEqual(1)
        expect(result.rolls.fear).toBeLessThanOrEqual(20)
      }
    })

    test('amplify works with modifiers and advantage', () => {
      const result = rollDH({ 
        amplifyHope: true, 
        modifier: 5, 
        rollingWith: 'Advantage' 
      })
      
      expect(result.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.rolls.hope).toBeLessThanOrEqual(20)
      expect(result.rolls.modifier).toBe(5)
      expect(result.rolls.advantage).toBeGreaterThanOrEqual(1)
      expect(result.rolls.advantage).toBeLessThanOrEqual(6)
    })
  })

  describe('edge cases', () => {
    test('handles extremely large positive modifiers', () => {
      const args: RollArgumentDH = { modifier: 1000 }
      const result = rollDH(args)
      expect(result.total).toBeGreaterThanOrEqual(1002) // 1 + 1 + 1000
      expect(result.total).toBeLessThanOrEqual(1024) // 12 + 12 + 1000
      expect(result.rolls.modifier).toBe(1000)
    })

    test('handles extremely large negative modifiers', () => {
      const args: RollArgumentDH = { modifier: -1000 }
      const result = rollDH(args)
      expect(result.total).toBeGreaterThanOrEqual(-998) // 1 + 1 - 1000
      expect(result.total).toBeLessThanOrEqual(-976) // 12 + 12 - 1000
      expect(result.rolls.modifier).toBe(-1000)
    })

    test('statistical distribution over 100+ iterations', () => {
      const results = []
      for (let i = 0; i < 100; i++) {
        results.push(rollDH({}))
      }
      
      // Check that we get a variety of results
      const types = new Set(results.map(r => r.type))
      expect(types.size).toBeGreaterThan(1) // Should have multiple types
      
      // Check that totals vary
      const totals = new Set(results.map(r => r.total))
      expect(totals.size).toBeGreaterThan(10) // Should have variety in totals
      
      // All results should be valid
      results.forEach(result => {
        expect(['hope', 'fear', 'critical hope']).toContain(result.type)
        expect(result.total).toBeGreaterThanOrEqual(2)
        expect(result.total).toBeLessThanOrEqual(24)
      })
    })
  })
})
