/**
 * Story 4: Dead Code Removal
 *
 * Verifies:
 * 1. validate.ts re-exports from lib/utils/validation.ts (not duplicated function bodies)
 */
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
