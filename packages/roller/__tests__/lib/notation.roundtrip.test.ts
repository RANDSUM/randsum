import { describe, expect, test } from 'bun:test'
import * as fc from 'fast-check'
import { optionsToNotation } from '../../src/lib/transformers'
import { notationToOptions } from '../../src/lib/notation/notationToOptions'
import type { ModifierOptions, RollOptions } from '../../src'

/**
 * Arbitrary generator for valid RollOptions
 */
function arbitraryValidOptions(): fc.Arbitrary<RollOptions> {
  return fc.record({
    sides: fc.integer({ min: 1, max: 100 }),
    quantity: fc.integer({ min: 1, max: 20 }),
    modifiers: fc.option(arbitraryModifiers(), { nil: undefined })
  })
}

/**
 * Arbitrary generator for ModifierOptions
 */
function arbitraryModifiers(): fc.Arbitrary<ModifierOptions> {
  return fc.record(
    {
      plus: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
      minus: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
      drop: fc.option(
        fc.record(
          {
            lowest: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
            highest: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined })
          },
          { requiredKeys: [] }
        ),
        { nil: undefined }
      ),
      explode: fc.option(fc.constant(true), { nil: undefined }),
      unique: fc.option(fc.constant(true), { nil: undefined })
    },
    { requiredKeys: [] }
  )
}

/**
 * Normalize options for comparison by removing undefined values
 */
function normalizeOptions(options: RollOptions): RollOptions {
  const normalized: RollOptions = {
    sides: options.sides,
    quantity: options.quantity ?? 1
  }

  if (options.modifiers) {
    const mods: ModifierOptions = {}
    const { plus, minus, drop, explode, unique } = options.modifiers

    if (plus !== undefined) mods.plus = plus
    if (minus !== undefined) mods.minus = minus
    if (drop !== undefined) {
      const dropOpts: { lowest?: number; highest?: number } = {}
      if (drop.lowest !== undefined) dropOpts.lowest = drop.lowest
      if (drop.highest !== undefined) dropOpts.highest = drop.highest
      if (Object.keys(dropOpts).length > 0) {
        mods.drop = dropOpts
      }
    }
    if (explode !== undefined) mods.explode = explode
    if (unique !== undefined) mods.unique = unique

    if (Object.keys(mods).length > 0) {
      normalized.modifiers = mods
    }
  }

  return normalized
}

/**
 * Compare normalized options
 */
function _optionsMatch(a: RollOptions, b: RollOptions): boolean {
  const normA = normalizeOptions(a)
  const normB = normalizeOptions(b)

  if (normA.sides !== normB.sides) return false
  if (normA.quantity !== normB.quantity) return false

  // Compare modifiers
  const modsA = normA.modifiers ?? {}
  const modsB = normB.modifiers ?? {}

  if (modsA.plus !== modsB.plus) return false
  if (modsA.minus !== modsB.minus) return false
  if (modsA.explode !== modsB.explode) return false
  if (modsA.unique !== modsB.unique) return false

  // Compare drop options
  if (modsA.drop?.lowest !== modsB.drop?.lowest) return false
  if (modsA.drop?.highest !== modsB.drop?.highest) return false

  return true
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
        expect(first.sides).toBe(options.sides)
        expect(first.quantity ?? 1).toBe(options.quantity ?? 1)

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
        const notation = optionsToNotation(options)
        const roundTripped = notationToOptions(notation)

        expect(roundTripped.length).toBe(1)
        const first = roundTripped[0]
        if (!first) return false

        expect(first.sides).toBe(options.sides)
        expect(first.quantity ?? 1).toBe(options.quantity)

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
        const notation = optionsToNotation(options)
        const roundTripped = notationToOptions(notation)

        expect(roundTripped.length).toBe(1)
        const first = roundTripped[0]
        if (!first) return false

        // Drop modifiers should be preserved
        if (options.modifiers.drop.lowest) {
          expect(first.modifiers?.drop?.lowest).toBe(options.modifiers.drop.lowest)
        }
        if (options.modifiers.drop.highest) {
          expect(first.modifiers?.drop?.highest).toBe(options.modifiers.drop.highest)
        }

        return true
      }),
      { numRuns: 50 }
    )
  })
})
