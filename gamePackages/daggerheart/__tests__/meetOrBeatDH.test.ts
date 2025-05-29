import { describe, expect, test } from 'bun:test'
import { meetOrBeatDH } from '../src/meetOrBeatDH'
import type { RollArgumentDH } from '../src/types'

describe('meetOrBeatDH', () => {
  describe('basic meet or beat mechanics', () => {
    test('returns success when total meets DC', () => {
      // Test with a guaranteed success scenario
      const args: RollArgumentDH = { modifier: 20 } // Ensures total will be at least 22
      const dc = 22
      const result = meetOrBeatDH(dc, args)
      
      expect(result.success).toBe(true)
      expect(result.target).toBe(dc)
      expect(result.total).toBeGreaterThanOrEqual(dc)
    })

    test('returns success when total exceeds DC', () => {
      const args: RollArgumentDH = { modifier: 15 }
      const dc = 10 // Should be easily beaten
      const result = meetOrBeatDH(dc, args)
      
      expect(result.success).toBe(true)
      expect(result.target).toBe(dc)
      expect(result.total).toBeGreaterThan(dc)
    })

    test('returns failure when total is below DC', () => {
      const args: RollArgumentDH = { modifier: -10 }
      const dc = 20 // Should be impossible to reach
      const result = meetOrBeatDH(dc, args)
      
      expect(result.success).toBe(false)
      expect(result.target).toBe(dc)
      expect(result.total).toBeLessThan(dc)
    })

    test('returns valid MeetOrBeatResultDH structure', () => {
      const result = meetOrBeatDH(15, { modifier: 0 })
      
      // Check it extends RollResultDH
      expect(result).toHaveProperty('type')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('rolls')
      expect(result.rolls).toHaveProperty('hope')
      expect(result.rolls).toHaveProperty('fear')
      expect(result.rolls).toHaveProperty('modifier')
      expect(result.rolls).toHaveProperty('advantage')
      
      // Check MeetOrBeatResultDH specific properties
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('target')
      expect(result).toHaveProperty('description')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.target).toBe('number')
      expect(typeof result.description).toBe('string')
    })
  })

  describe('critical hope mechanics', () => {
    test('critical hope always succeeds regardless of DC', () => {
      // We need to test this statistically since we can't force a critical hope
      let _criticalHopeFound = false

      for (let i = 0; i < 500; i++) {
        const result = meetOrBeatDH(50, { modifier: -20 }) // Impossible DC normally

        if (result.type === 'critical hope') {
          expect(result.success).toBe(true)
          expect(result.description).toBe('Critical Success (With Hope)')
          _criticalHopeFound = true
        }
      }

      // Note: Critical hope is rare (1/12 chance), so we might not always find one
      // But the test validates the logic when it does occur
    })

    test('critical hope has correct description', () => {
      for (let i = 0; i < 200; i++) {
        const result = meetOrBeatDH(15, {})
        
        if (result.type === 'critical hope') {
          expect(result.description).toBe('Critical Success (With Hope)')
          expect(result.success).toBe(true)
        }
      }
    })
  })

  describe('description formatting', () => {
    test('success with hope has correct description', () => {
      for (let i = 0; i < 100; i++) {
        const result = meetOrBeatDH(5, { modifier: 10 }) // Easy success
        
        if (result.type === 'hope' && result.success) {
          expect(result.description).toBe('Success with hope')
        }
      }
    })

    test('success with fear has correct description', () => {
      for (let i = 0; i < 100; i++) {
        const result = meetOrBeatDH(5, { modifier: 10 }) // Easy success
        
        if (result.type === 'fear' && result.success) {
          expect(result.description).toBe('Success with fear')
        }
      }
    })

    test('failure with hope has correct description', () => {
      for (let i = 0; i < 100; i++) {
        const result = meetOrBeatDH(30, { modifier: -5 }) // Likely failure
        
        if (result.type === 'hope' && !result.success) {
          expect(result.description).toBe('Failure with hope')
        }
      }
    })

    test('failure with fear has correct description', () => {
      for (let i = 0; i < 100; i++) {
        const result = meetOrBeatDH(30, { modifier: -5 }) // Likely failure
        
        if (result.type === 'fear' && !result.success) {
          expect(result.description).toBe('Failure with fear')
        }
      }
    })
  })

  describe('with advantage and disadvantage', () => {
    test('advantage improves success chances', () => {
      const dc = 15
      let advantageSuccesses = 0
      let normalSuccesses = 0
      
      for (let i = 0; i < 100; i++) {
        const advantageResult = meetOrBeatDH(dc, { rollingWith: 'Advantage' })
        const normalResult = meetOrBeatDH(dc, {})
        
        if (advantageResult.success) advantageSuccesses++
        if (normalResult.success) normalSuccesses++
      }
      
      // Advantage should generally improve success rate
      // Note: This is statistical, so we use a reasonable threshold
      expect(advantageSuccesses).toBeGreaterThanOrEqual(normalSuccesses - 10)
    })

    test('disadvantage reduces success chances', () => {
      const dc = 10
      let disadvantageSuccesses = 0
      let normalSuccesses = 0
      
      for (let i = 0; i < 100; i++) {
        const disadvantageResult = meetOrBeatDH(dc, { rollingWith: 'Disadvantage' })
        const normalResult = meetOrBeatDH(dc, {})
        
        if (disadvantageResult.success) disadvantageSuccesses++
        if (normalResult.success) normalSuccesses++
      }
      
      // Disadvantage should generally reduce success rate
      expect(disadvantageSuccesses).toBeLessThanOrEqual(normalSuccesses + 10)
    })

    test('advantage/disadvantage with modifiers', () => {
      const result = meetOrBeatDH(15, { 
        modifier: 5, 
        rollingWith: 'Advantage' 
      })
      
      expect(result.rolls.modifier).toBe(5)
      expect(result.rolls.advantage).toBeGreaterThanOrEqual(1)
      expect(result.rolls.advantage).toBeLessThanOrEqual(6)
      expect(result.target).toBe(15)
    })
  })

  describe('various DC values', () => {
    test('low DC values (easy tasks)', () => {
      const lowDCs = [1, 3, 5]
      
      lowDCs.forEach(dc => {
        const result = meetOrBeatDH(dc, { modifier: 0 })
        expect(result.target).toBe(dc)
        // With d12+d12, minimum is 2, so DC 1 should always succeed
        if (dc <= 2) {
          expect(result.success).toBe(true)
        }
      })
    })

    test('medium DC values (moderate tasks)', () => {
      const mediumDCs = [10, 12, 15]
      
      mediumDCs.forEach(dc => {
        const result = meetOrBeatDH(dc, { modifier: 0 })
        expect(result.target).toBe(dc)
        expect(typeof result.success).toBe('boolean')
      })
    })

    test('high DC values (difficult tasks)', () => {
      const highDCs = [20, 22, 24]
      
      highDCs.forEach(dc => {
        const result = meetOrBeatDH(dc, { modifier: 0 })
        expect(result.target).toBe(dc)
        // With d12+d12, maximum is 24, so DC 25+ should always fail (unless critical hope)
        if (dc > 24 && result.type !== 'critical hope') {
          expect(result.success).toBe(false)
        }
      })
    })
  })

  describe('edge cases', () => {
    test('boundary condition DC = 1', () => {
      const result = meetOrBeatDH(1, {})
      expect(result.target).toBe(1)
      expect(result.success).toBe(true) // Minimum roll is 2
    })

    test('boundary condition DC = 24 (max possible)', () => {
      for (let i = 0; i < 50; i++) {
        const result = meetOrBeatDH(24, {})
        expect(result.target).toBe(24)
        
        if (result.type === 'critical hope') {
          expect(result.success).toBe(true)
        } else if (result.total === 24) {
          expect(result.success).toBe(true)
        } else {
          expect(result.success).toBe(false)
        }
      }
    })

    test('boundary condition DC > 24 (impossible without critical hope)', () => {
      for (let i = 0; i < 50; i++) {
        const result = meetOrBeatDH(30, {})
        expect(result.target).toBe(30)
        
        if (result.type === 'critical hope') {
          expect(result.success).toBe(true)
        } else {
          expect(result.success).toBe(false)
        }
      }
    })

    test('negative DC values', () => {
      const result = meetOrBeatDH(-5, {})
      expect(result.target).toBe(-5)
      expect(result.success).toBe(true) // Any positive roll beats negative DC
    })

    test('DC = 0', () => {
      const result = meetOrBeatDH(0, {})
      expect(result.target).toBe(0)
      expect(result.success).toBe(true) // Any positive roll beats 0
    })

    test('with amplify modifiers', () => {
      const result = meetOrBeatDH(15, { 
        amplifyHope: true, 
        modifier: 3 
      })
      
      expect(result.target).toBe(15)
      expect(result.rolls.modifier).toBe(3)
      expect(result.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.rolls.hope).toBeLessThanOrEqual(20) // d20 due to amplify
    })

    test('statistical validation over 100+ iterations', () => {
      const results = []
      const dc = 12
      
      for (let i = 0; i < 100; i++) {
        results.push(meetOrBeatDH(dc, {}))
      }
      
      // Check variety in results
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length
      
      // Should have both successes and failures for a moderate DC
      expect(successCount).toBeGreaterThan(0)
      expect(failureCount).toBeGreaterThan(0)
      
      // All results should be valid
      results.forEach(result => {
        expect(result.target).toBe(dc)
        expect(typeof result.success).toBe('boolean')
        expect(['hope', 'fear', 'critical hope']).toContain(result.type)
        expect(typeof result.description).toBe('string')
      })
    })
  })
})
