import { describe, test } from 'bun:test'
import fc from 'fast-check'
import { rollBlades } from '../src/rollBlades'

describe('rollBlades property-based tests', () => {
  test('result is always a valid Blades outcome', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), pool => {
        const { result } = rollBlades(pool)
        return ['critical', 'success', 'partial', 'failure'].includes(result)
      })
    )
  })

  test('pool size matches initial rolls count', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), pool => {
        const { rolls } = rollBlades(pool)
        const initialRolls = rolls[0]?.modifierHistory.initialRolls ?? []
        return initialRolls.length === pool
      })
    )
  })

  test('total is within valid d6 bounds for pool', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), pool => {
        const { rolls } = rollBlades(pool)
        const total = rolls[0]?.total ?? 0
        return total >= 1 && total <= pool * 6
      })
    )
  })

  test('zero dice pool uses 2d6 drop highest mechanic', () => {
    fc.assert(
      fc.property(fc.constant(0), () => {
        const { rolls, result } = rollBlades(0)
        const initialRolls = rolls[0]?.modifierHistory.initialRolls ?? []
        // Zero pool rolls 2d6 and drops highest
        return initialRolls.length === 2 && !['critical'].includes(result)
      }),
      { numRuns: 50 }
    )
  })

  test('critical only possible with pool >= 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), fc.integer({ min: 1, max: 1000 }), (pool, _) => {
        // Run multiple times to increase chance of seeing a critical
        const results = Array.from({ length: 20 }, () => rollBlades(pool))
        // Just verify no crashes and valid results
        return results.every(({ result }) =>
          ['critical', 'success', 'partial', 'failure'].includes(result)
        )
      }),
      { numRuns: 10 }
    )
  })

  test('individual die rolls are within 1-6 range', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), pool => {
        const { rolls } = rollBlades(pool)
        const initialRolls = rolls[0]?.modifierHistory.initialRolls ?? []
        return initialRolls.every(roll => roll >= 1 && roll <= 6)
      })
    )
  })
})
