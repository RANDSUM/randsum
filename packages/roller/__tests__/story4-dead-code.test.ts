/**
 * Story 4: Dead Code Removal
 *
 * Verifies:
 * 1. validate.ts re-exports from lib/utils/validation.ts (not duplicated function bodies)
 * 2. MODIFIER_PRIORITIES values match the priorities in RANDSUM_MODIFIERS
 */
/* eslint-disable @typescript-eslint/no-deprecated */
import { describe, expect, test } from 'bun:test'
import {
  validateFinite,
  validateInteger,
  validateNonNegative,
  validateRange
} from '../src/validate'
import {
  validateFinite as libValidateFinite,
  validateInteger as libValidateInteger,
  validateNonNegative as libValidateNonNegative,
  validateRange as libValidateRange
} from '../src/lib/utils/validation'
import { MODIFIER_PRIORITIES, RANDSUM_MODIFIERS } from '../src/modifiers'

describe('validate.ts is a re-export, not a copy', () => {
  test('validateInteger from validate.ts is the same function as from lib/utils/validation.ts', () => {
    expect(validateInteger).toBe(libValidateInteger)
  })

  test('validateRange from validate.ts is the same function as from lib/utils/validation.ts', () => {
    expect(validateRange).toBe(libValidateRange)
  })

  test('validateNonNegative from validate.ts is the same function as from lib/utils/validation.ts', () => {
    expect(validateNonNegative).toBe(libValidateNonNegative)
  })

  test('validateFinite from validate.ts is the same function as from lib/utils/validation.ts', () => {
    expect(validateFinite).toBe(libValidateFinite)
  })
})

describe('MODIFIER_PRIORITIES values match RANDSUM_MODIFIERS (deprecated sync check)', () => {
  test('every modifier in RANDSUM_MODIFIERS has a matching entry in MODIFIER_PRIORITIES', () => {
    for (const modifier of RANDSUM_MODIFIERS) {
      expect(MODIFIER_PRIORITIES).toHaveProperty(modifier.name)
    }
  })

  test('priority values in MODIFIER_PRIORITIES match those in RANDSUM_MODIFIERS', () => {
    for (const modifier of RANDSUM_MODIFIERS) {
      expect(MODIFIER_PRIORITIES[modifier.name as keyof typeof MODIFIER_PRIORITIES]).toBe(
        modifier.priority
      )
    }
  })

  test('MODIFIER_PRIORITIES has the same count as RANDSUM_MODIFIERS', () => {
    // Count unique modifier names (some modifiers like countSuccesses/countFailures share the 'count' key)
    const uniqueNames = new Set(RANDSUM_MODIFIERS.map(m => m.name))
    expect(Object.keys(MODIFIER_PRIORITIES).length).toBe(uniqueNames.size)
  })
})
