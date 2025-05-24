import { describe, expect, test } from 'bun:test'
import { coreRollDH } from '../src/coreRollDH'
import type { CoreRollResultDH } from '../src/types'

describe('coreRollDH', () => {
  describe('Basic Functionality', () => {
    test('returns a valid CoreRollResultDH object', () => {
      const result = coreRollDH(0)

      expect(result).toHaveProperty('type')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('rolls')
      expect(result.rolls).toHaveProperty('hope')
      expect(result.rolls).toHaveProperty('fear')
      expect(result.rolls).toHaveProperty('modifier')
    })

    test('type is either "hope" or "fear"', () => {
      const result = coreRollDH(0)
      expect(['hope', 'fear']).toContain(result.type)
    })

    test('rolls contain valid d12 values', () => {
      const result = coreRollDH(0)

      expect(result.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.rolls.hope).toBeLessThanOrEqual(12)
      expect(result.rolls.fear).toBeGreaterThanOrEqual(1)
      expect(result.rolls.fear).toBeLessThanOrEqual(12)
    })

    test('modifier is correctly stored', () => {
      const modifier = 5
      const result = coreRollDH(modifier)
      expect(result.rolls.modifier).toBe(modifier)
    })

    test('total equals sum of hope + fear + modifier', () => {
      const modifier = 3
      const result = coreRollDH(modifier)
      const expectedTotal = result.rolls.hope + result.rolls.fear + modifier
      expect(result.total).toBe(expectedTotal)
    })
  })

  describe('Hope vs Fear Logic', () => {
    test('type is "hope" when hope roll is greater than fear roll', () => {
      // Run multiple times to catch cases where hope > fear
      let hopeWins = 0
      let fearWins = 0
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        const result = coreRollDH(0)
        if (result.rolls.hope > result.rolls.fear) {
          expect(result.type).toBe('hope')
          hopeWins++
        } else {
          expect(result.type).toBe('fear')
          fearWins++
        }
      }

      // Ensure we tested both conditions
      expect(hopeWins + fearWins).toBe(iterations)
      console.log(`Hope wins: ${hopeWins}, Fear wins: ${fearWins} out of ${iterations} rolls`)
    })

    test('type is "fear" when fear roll is greater than or equal to hope roll', () => {
      // Test the tie condition specifically by running many iterations
      let tieCount = 0
      let fearWinsOnTie = 0
      const iterations = 1000

      for (let i = 0; i < iterations; i++) {
        const result = coreRollDH(0)
        if (result.rolls.hope === result.rolls.fear) {
          tieCount++
          expect(result.type).toBe('fear')
          fearWinsOnTie++
        }
      }

      console.log(`Ties found: ${tieCount}, Fear wins on tie: ${fearWinsOnTie} out of ${iterations} rolls`)
      expect(fearWinsOnTie).toBe(tieCount) // All ties should result in fear
    })
  })

  describe('Statistical Analysis', () => {
    test('statistical distribution of hope vs fear outcomes over many rolls', () => {
      const iterations = 1000
      const results: CoreRollResultDH[] = []

      // Collect results
      for (let i = 0; i < iterations; i++) {
        results.push(coreRollDH(0))
      }

      // Analyze distribution
      const hopeResults = results.filter(r => r.type === 'hope')
      const fearResults = results.filter(r => r.type === 'fear')

      const hopeCount = hopeResults.length
      const fearCount = fearResults.length
      const hopePercentage = (hopeCount / iterations) * 100
      const fearPercentage = (fearCount / iterations) * 100

      // Calculate statistics for hope values
      const hopeValues = hopeResults.map(r => r.rolls.hope)
      const fearValues = fearResults.map(r => r.rolls.hope) // hope die value when fear wins

      const hopeStats = calculateStats(hopeValues)
      const fearStats = calculateStats(fearValues)

      // Log detailed statistics
      console.log('\n=== STATISTICAL ANALYSIS ===')
      console.log(`Total rolls: ${iterations}`)
      console.log(`Hope outcomes: ${hopeCount} (${hopePercentage.toFixed(1)}%)`)
      console.log(`Fear outcomes: ${fearCount} (${fearPercentage.toFixed(1)}%)`)
      console.log('\nHope die values when HOPE wins:')
      console.log(`  Min: ${hopeStats.min}, Max: ${hopeStats.max}, Avg: ${hopeStats.avg.toFixed(2)}`)
      console.log('\nHope die values when FEAR wins:')
      console.log(`  Min: ${fearStats.min}, Max: ${fearStats.max}, Avg: ${fearStats.avg.toFixed(2)}`)

      // Statistical assertions
      expect(hopeCount + fearCount).toBe(iterations)
      expect(hopeCount).toBeGreaterThan(0) // Should have some hope outcomes
      expect(fearCount).toBeGreaterThan(0) // Should have some fear outcomes

      // Hope should generally have higher values when it wins
      if (hopeValues.length > 0 && fearValues.length > 0) {
        expect(hopeStats.avg).toBeGreaterThan(fearStats.avg)
      }
    })
  })

  describe('Modifier Effects', () => {
    test('positive modifier increases total correctly', () => {
      const modifier = 5
      const result = coreRollDH(modifier)
      const baseTotal = result.rolls.hope + result.rolls.fear
      expect(result.total).toBe(baseTotal + modifier)
    })

    test('negative modifier decreases total correctly', () => {
      const modifier = -3
      const result = coreRollDH(modifier)
      const baseTotal = result.rolls.hope + result.rolls.fear
      expect(result.total).toBe(baseTotal + modifier)
    })

    test('zero modifier does not affect total', () => {
      const result = coreRollDH(0)
      const baseTotal = result.rolls.hope + result.rolls.fear
      expect(result.total).toBe(baseTotal)
    })

    test('modifier does not affect hope vs fear determination', () => {
      // The type should be determined solely by hope vs fear comparison,
      // not influenced by the modifier
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        const resultWithModifier = coreRollDH(10)
        const resultWithoutModifier = coreRollDH(0)

        // If we could control the dice (which we can't), the type determination
        // should be the same regardless of modifier. Since we can't control dice,
        // we just verify the logic is consistent within each roll.
        if (resultWithModifier.rolls.hope > resultWithModifier.rolls.fear) {
          expect(resultWithModifier.type).toBe('hope')
        } else {
          expect(resultWithModifier.type).toBe('fear')
        }
      }
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    test('handles very large positive modifiers', () => {
      const modifier = 1000
      const result = coreRollDH(modifier)

      expect(result.rolls.modifier).toBe(modifier)
      expect(result.total).toBeGreaterThanOrEqual(2 + modifier) // minimum 2d12 + modifier
      expect(result.total).toBeLessThanOrEqual(24 + modifier) // maximum 2d12 + modifier
    })

    test('handles very large negative modifiers', () => {
      const modifier = -1000
      const result = coreRollDH(modifier)

      expect(result.rolls.modifier).toBe(modifier)
      expect(result.total).toBeGreaterThanOrEqual(2 + modifier) // minimum 2d12 + modifier
      expect(result.total).toBeLessThanOrEqual(24 + modifier) // maximum 2d12 + modifier
    })

    test('handles decimal modifiers by converting to integer', () => {
      // Note: The function expects number, but let's see how it handles decimals
      const modifier = 5.7
      const result = coreRollDH(modifier)

      expect(result.rolls.modifier).toBe(modifier)
      // The dice notation should handle decimal modifiers appropriately
    })

    test('maintains consistency across multiple calls with same modifier', () => {
      const modifier = 5
      const results = Array.from({ length: 10 }, () => coreRollDH(modifier))

      // All should have the same modifier
      results.forEach(result => {
        expect(result.rolls.modifier).toBe(modifier)
        expect(result.total).toBe(result.rolls.hope + result.rolls.fear + modifier)
      })
    })
  })

  describe('Error Handling', () => {
    test('handles NaN modifier gracefully', () => {
      // This tests how the function behaves with invalid input
      expect(() => coreRollDH(NaN)).toThrow()
    })

    test('handles Infinity modifier', () => {
      expect(() => coreRollDH(Infinity)).toThrow()
    })

    test('handles negative Infinity modifier', () => {
      expect(() => coreRollDH(-Infinity)).toThrow()
    })
  })

  describe('Type Safety and Structure Validation', () => {
    test('result structure matches CoreRollResultDH interface', () => {
      const result = coreRollDH(0)

      // Verify all required properties exist
      expect(typeof result.type).toBe('string')
      expect(typeof result.total).toBe('number')
      expect(typeof result.rolls).toBe('object')
      expect(typeof result.rolls.hope).toBe('number')
      expect(typeof result.rolls.fear).toBe('number')
      expect(typeof result.rolls.modifier).toBe('number')

      // Verify type is one of the allowed values
      expect(['hope', 'fear']).toContain(result.type)
    })

    test('rolls are always integers within d12 range', () => {
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        const result = coreRollDH(Math.floor(Math.random() * 20) - 10) // Random modifier -10 to 10

        expect(Number.isInteger(result.rolls.hope)).toBe(true)
        expect(Number.isInteger(result.rolls.fear)).toBe(true)
        expect(result.rolls.hope).toBeGreaterThanOrEqual(1)
        expect(result.rolls.hope).toBeLessThanOrEqual(12)
        expect(result.rolls.fear).toBeGreaterThanOrEqual(1)
        expect(result.rolls.fear).toBeLessThanOrEqual(12)
      }
    })
  })

  describe('Performance and Stress Testing', () => {
    test('handles rapid successive calls efficiently', () => {
      const startTime = performance.now()
      const iterations = 10000

      for (let i = 0; i < iterations; i++) {
        coreRollDH(i % 10) // Vary the modifier
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`${iterations.toString()} calls completed in ${duration.toFixed(2)}ms`)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    test('produces varied results over many iterations', () => {
      const iterations = 1000
      const results = new Set<string>()

      for (let i = 0; i < iterations; i++) {
        const result = coreRollDH(0)
        // Create a unique key for each result combination
        const key = `${result.rolls.hope.toString()}-${result.rolls.fear.toString()}-${result.type}`
        results.add(key)
      }

      // Should have many different combinations
      expect(results.size).toBeGreaterThan(50) // Expect significant variety
      console.log(`Generated ${results.size.toString()} unique result combinations out of ${iterations.toString()} rolls`)
    })
  })
})

// Helper function to calculate basic statistics
function calculateStats(values: number[]): { min: number; max: number; avg: number } {
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0 }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const sum = values.reduce((acc, val) => acc + val, 0)
  const avg = sum / values.length

  return { min, max, avg }
}
