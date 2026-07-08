/**
 * Integration test: exercises the real /roll command handler against an
 * UN-mocked @randsum/roller. Unlike the unit tests (which mock.module the roller
 * and stub roll output), this test injects a seeded random into the real engine
 * so the produced embed content is deterministic for a known seed, then asserts
 * the reply the user would actually receive.
 *
 * This is the one cross-boundary test that would catch a real roller/bot
 * integration defect (e.g. a result shape change) that the mocked unit tests
 * cannot.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { roll } from '@randsum/roller/roll'
import { notation } from '@randsum/roller/validate'
import { rollCommand } from '../../src/commands/roll.js'

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

interface RecordingInteraction {
  readonly deferReply: () => Promise<void>
  readonly editReply: (payload: unknown) => Promise<void>
  readonly options: {
    readonly getString: (name: string) => string | null
    readonly getBoolean: (name: string) => boolean | null
  }
  readonly captured: unknown[]
}

function makeInteraction(notationString: string): RecordingInteraction {
  const captured: unknown[] = []
  return {
    deferReply: () => Promise.resolve(),
    editReply: (payload: unknown) => {
      captured.push(payload)
      return Promise.resolve()
    },
    options: {
      getString: (name: string) => (name === 'notation' ? notationString : null),
      getBoolean: () => false
    },
    captured
  }
}

function embedFromPayload(payload: unknown): APIEmbed {
  const typed = payload as { embeds: { toJSON: () => APIEmbed }[] }
  return typed.embeds[0]!.toJSON()
}

beforeEach(() => {
  Math.random = seededRandom(42)
})

afterEach(() => {
  Math.random = realRandom
})

describe('roll command integration (un-mocked roller)', () => {
  test('produces a deterministic total for a known seed', async () => {
    // Derive the expected total from the real engine under the same seed, so the
    // assertion stays valid if the seeded sequence changes but the engine is
    // still the one actually driving the command.
    Math.random = seededRandom(42)
    const expected = roll(notation('2d6')).total
    Math.random = seededRandom(42)

    const interaction = makeInteraction('2d6')
    await rollCommand.execute(interaction as never)

    expect(interaction.captured).toHaveLength(1)
    const embed = embedFromPayload(interaction.captured[0])
    expect(embed.title).toBe(`You rolled a ${expected}`)
    expect(String(embed.description)).toContain('2d6')
  })

  test('arithmetic-only notation does not render a Modified Rolls field', async () => {
    // Regression guard: the real roller emits a modifierLog for every applied
    // modifier, including non-mutating arithmetic ones (plus/minus/...), so a
    // `modifierLogs.length > 0` gate would wrongly add a "Modified Rolls" field
    // that duplicates "Initial Rolls". The rolled dice are unchanged for
    // 2d6+3, so only "Initial Rolls" should appear.
    const interaction = makeInteraction('2d6+3')
    await rollCommand.execute(interaction as never)

    const embed = embedFromPayload(interaction.captured[0]) as APIEmbed & {
      fields?: { name: string }[]
    }
    const fieldNames = (embed.fields ?? []).map(f => f.name)
    expect(fieldNames).toContain('Initial Rolls')
    expect(fieldNames).not.toContain('Modified Rolls')
  })

  test('total is within the valid range for the notation', async () => {
    const interaction = makeInteraction('3d8')
    await rollCommand.execute(interaction as never)

    const embed = embedFromPayload(interaction.captured[0])
    const match = /You rolled a (\d+)/.exec(embed.title ?? '')
    expect(match).not.toBeNull()
    const total = Number(match![1])
    expect(total).toBeGreaterThanOrEqual(3)
    expect(total).toBeLessThanOrEqual(24)
  })
})
