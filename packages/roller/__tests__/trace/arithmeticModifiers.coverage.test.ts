import { describe, expect, test } from 'bun:test'

import { ARITHMETIC_MODIFIERS } from '../../src/trace/traceRoll'
import { RANDSUM_MODIFIERS } from '../../src/modifiers'

/**
 * The trace renderer's ARITHMETIC_MODIFIERS map must stay in sync with the
 * modifier registry: it should cover exactly the modifiers whose primary docs
 * category is 'Scale' (plus/minus/multiply/multiplyTotal/integerDivide/modulo).
 *
 * If a new arithmetic modifier is added to the registry without a matching
 * ARITHMETIC_MODIFIERS entry (or vice versa), these tests fail.
 */
const registryArithmeticNames: string[] = RANDSUM_MODIFIERS.filter(
  modifier => modifier.docs?.[0]?.category === 'Scale'
)
  .map(modifier => modifier.name as string)
  .sort()

describe('ARITHMETIC_MODIFIERS registry coverage', () => {
  test('covers every Scale-category modifier in the registry', () => {
    const mapped = Object.keys(ARITHMETIC_MODIFIERS).sort()
    expect(mapped).toEqual([...registryArithmeticNames])
  })

  test('has no entries that are not registered modifiers', () => {
    const registeredNames = new Set<string>(RANDSUM_MODIFIERS.map(modifier => modifier.name))
    for (const key of Object.keys(ARITHMETIC_MODIFIERS)) {
      expect(registeredNames.has(key)).toBe(true)
    }
  })

  test('every entry has a non-empty label and sign', () => {
    for (const [name, meta] of Object.entries(ARITHMETIC_MODIFIERS)) {
      expect(meta, `missing metadata for ${name}`).toBeDefined()
      expect(meta?.label.length ?? 0).toBeGreaterThan(0)
      expect(meta?.sign.length ?? 0).toBeGreaterThan(0)
    }
  })
})
