import { describe, expect, test } from 'bun:test'
import fc from 'fast-check'
import { createModifierLog } from '../../../src/modifiers/log'

/**
 * Reference implementation: compute the multiset difference via a
 * frequency map. Treats `added`/`removed` as multisets (order ignored).
 */
function referenceMultisetDiff(
  initial: readonly number[],
  next: readonly number[]
): { added: Map<number, number>; removed: Map<number, number> } {
  const initialFreq = new Map<number, number>()
  for (const v of initial) initialFreq.set(v, (initialFreq.get(v) ?? 0) + 1)
  const nextFreq = new Map<number, number>()
  for (const v of next) nextFreq.set(v, (nextFreq.get(v) ?? 0) + 1)

  const added = new Map<number, number>()
  const removed = new Map<number, number>()

  const allValues = new Set([...initialFreq.keys(), ...nextFreq.keys()])
  for (const value of allValues) {
    const diff = (nextFreq.get(value) ?? 0) - (initialFreq.get(value) ?? 0)
    if (diff > 0) added.set(value, diff)
    else if (diff < 0) removed.set(value, -diff)
  }

  return { added, removed }
}

function toFreqMap(values: readonly number[]): Map<number, number> {
  const m = new Map<number, number>()
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1)
  return m
}

function mapsEqual(a: Map<number, number>, b: Map<number, number>): boolean {
  if (a.size !== b.size) return false
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false
  }
  return true
}

describe('createModifierLog — multiset equivalence', () => {
  test('added/removed multisets match the frequency-based reference', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 20 }), { maxLength: 12 }),
        fc.array(fc.integer({ min: 1, max: 20 }), { maxLength: 12 }),
        (initial, next) => {
          const log = createModifierLog('test', undefined, initial, next)
          const reference = referenceMultisetDiff(initial, next)

          expect(mapsEqual(toFreqMap(log.added), reference.added)).toBe(true)
          expect(mapsEqual(toFreqMap(log.removed), reference.removed)).toBe(true)
        }
      ),
      { numRuns: 200 }
    )
  })

  test('sum(added) + sum(removed) is independent of value ordering', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 20 }), { maxLength: 12 }),
        fc.array(fc.integer({ min: 1, max: 20 }), { maxLength: 12 }),
        (initial, next) => {
          const log = createModifierLog('test', undefined, initial, next)

          const initialSum = initial.reduce((acc, v) => acc + v, 0)
          const nextSum = next.reduce((acc, v) => acc + v, 0)
          const addedSum = log.added.reduce((acc, v) => acc + v, 0)
          const removedSum = log.removed.reduce((acc, v) => acc + v, 0)

          // initial + added - removed === next (holds as multiset arithmetic)
          expect(initialSum + addedSum - removedSum).toBe(nextSum)
        }
      ),
      { numRuns: 200 }
    )
  })
})
