import { describe, expect, test } from 'bun:test'
import * as fc from 'fast-check'
import { optionsToNotation } from '../../src/notation/transformers/optionsToNotation'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'
import type { RollOptions } from '../../src'

/**
 * Arbitrary generator for valid RollOptions (numeric sides only)
 */
function arbitraryValidOptions(): fc.Arbitrary<RollOptions> {
  return fc.record({
    sides: fc.integer({ min: 1, max: 100 }),
    quantity: fc.integer({ min: 1, max: 20 })
  })
}

describe('notation round-trip property tests', () => {
  test('optionsToNotation produces valid notation for generated options', () => {
    fc.assert(
      fc.property(arbitraryValidOptions(), options => {
        const notation = optionsToNotation(options)
        expect(typeof notation).toBe('string')
        expect(notation.length).toBeGreaterThan(0)
        expect(notation).toMatch(/^\d+d\d+/)
      }),
      { numRuns: 100 }
    )
  })

  test('options to notation to options preserves core properties', () => {
    fc.assert(
      fc.property(arbitraryValidOptions(), options => {
        const notation = optionsToNotation(options)
        const roundTripped = notationToOptions(notation)

        // Should return at least one options object
        expect(roundTripped.length).toBeGreaterThan(0)

        const first = roundTripped[0]
        if (!first) return false

        // Core properties should match
        expect(first.sides).toBe(options.sides as number)
        expect(first.quantity).toBe(options.quantity ?? 1)

        return true
      }),
      { numRuns: 100 }
    )
  })

  test('simple options round-trip is idempotent', () => {
    // Test with simpler options that have well-defined round-trip behavior
    const simpleOptions = fc.record({
      sides: fc.integer({ min: 1, max: 100 }),
      quantity: fc.integer({ min: 1, max: 20 })
    })

    fc.assert(
      fc.property(simpleOptions, options => {
        const notation = optionsToNotation(options as RollOptions)
        const roundTripped = notationToOptions(notation)

        expect(roundTripped.length).toBe(1)
        const first = roundTripped[0]
        if (!first) return false

        expect(first.sides).toBe(options.sides)
        expect(first.quantity).toBe(options.quantity)

        return true
      }),
      { numRuns: 100 }
    )
  })

  test('options with drop modifier round-trip preserves drop settings', () => {
    const optionsWithDrop = fc.record({
      sides: fc.integer({ min: 1, max: 20 }),
      quantity: fc.integer({ min: 2, max: 10 }),
      modifiers: fc.record({
        drop: fc.record(
          {
            lowest: fc.option(fc.constant(1), { nil: undefined }),
            highest: fc.option(fc.constant(1), { nil: undefined })
          },
          { requiredKeys: [] }
        )
      })
    })

    fc.assert(
      fc.property(optionsWithDrop, options => {
        const notation = optionsToNotation(options as RollOptions)
        const roundTripped = notationToOptions(notation)

        expect(roundTripped.length).toBe(1)
        const first = roundTripped[0]
        if (!first) return false

        // Drop modifiers should be preserved
        const drop = options.modifiers.drop
        if (drop.lowest) {
          expect(first.modifiers?.drop?.lowest).toBe(drop.lowest)
        }
        if (drop.highest) {
          expect(first.modifiers?.drop?.highest).toBe(drop.highest)
        }

        return true
      }),
      { numRuns: 50 }
    )
  })
})
