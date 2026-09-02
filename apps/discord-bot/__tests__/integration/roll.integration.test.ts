/**
 * Integration test: exercises the real /roll renderer against an UN-mocked
 * @randsum/roller. Unlike the unit tests (which mock.module the roller and stub
 * roll output), this test injects a seeded random into the real engine so the
 * produced embed content is deterministic for a known seed, then asserts the
 * embed the user would actually receive.
 *
 * This is the one cross-boundary test that would catch a real roller/bot
 * integration defect (e.g. a result shape change) that the mocked unit tests
 * cannot.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { linesOf, textOf } from '../lib/view.js'
import type { RollView } from '../../src/types.js'
import { roll } from '@randsum/roller/roll'
import { notation } from '@randsum/roller/validate'
import { rollCommand } from '../../src/commands/roll.js'
import { makeContext } from '../commands/lib/context.js'

// Capture the real Math.random so we can restore it after each test.
const realRandom = Math.random

function seededRandom(seed: number): () => number {
  // Mulberry32 — small, deterministic PRNG sufficient for a fixed-seed assertion.
  const holder = { state: seed >>> 0 }
  return () => {
    holder.state = (holder.state + 0x6d2b79f5) | 0
    const a = Math.imul(holder.state ^ (holder.state >>> 15), 1 | holder.state)
    const b = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a
    return ((b ^ (b >>> 14)) >>> 0) / 4294967296
  }
}

function render(notationString: string): RollView {
  return rollCommand.buildView!(makeContext([{ name: 'notation', value: notationString }]))
}

beforeEach(() => {
  Math.random = seededRandom(42)
})

afterEach(() => {
  Math.random = realRandom
})

describe('roll command integration (un-mocked roller)', () => {
  test('produces a deterministic total for a known seed', () => {
    // Derive the expected total from the real engine under the same seed, so the
    // assertion stays valid if the seeded sequence changes but the engine is
    // still the one actually driving the command.
    Math.random = seededRandom(42)
    const expected = roll(notation('2d6')).total
    Math.random = seededRandom(42)

    const view = render('2d6')
    expect(linesOf(view)[0]).toBe(`## ${expected}`)
    expect(textOf(view)).toContain('2d6')
  })

  test('arithmetic-only notation renders its dice unmarked', () => {
    // Regression guard: the real roller emits a modifierLog for every applied
    // modifier, including non-mutating arithmetic ones (plus/minus/...). The
    // rolled dice are unchanged for 2d6+3, so no die should be struck through
    // — a `modifierLogs.length > 0` gate would wrongly mark them.
    const text = textOf(render('2d6+3'))
    expect(text).toContain('**Add**  +3')
    expect(text).not.toContain('~~')
  })

  test('total is within the valid range for the notation', () => {
    const match = /^## (\d+)$/.exec(linesOf(render('3d8'))[0] ?? '')
    expect(match).not.toBeNull()
    const total = Number(match![1])
    expect(total).toBeGreaterThanOrEqual(3)
    expect(total).toBeLessThanOrEqual(24)
  })

  test('invalid notation throws for the dispatcher to render', () => {
    // The real validator, not a mock: this is the path a user hits by typing
    // nonsense, and the dispatcher's catch turns it into an error embed.
    expect(() => render('not-notation')).toThrow()
  })
})
