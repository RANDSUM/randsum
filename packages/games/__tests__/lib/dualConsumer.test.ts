import { describe, expect, test } from 'bun:test'
import { loadSpec } from '../../src/lib/loader'
import type { GameRollResult, RandSumSpec, RollInput } from '../../src/lib/types'
import * as bladesGen from '../../src/blades.generated'
import * as pbtaGen from '../../src/pbta.generated'
import * as fifthGen from '../../src/fifth.generated'
import * as daggerheartGen from '../../src/daggerheart.generated'
import * as rootGen from '../../src/root-rpg.generated'
import bladesSpec from '../../blades.randsum.json'
import pbtaSpec from '../../pbta.randsum.json'
import fifthSpec from '../../fifth.randsum.json'
import daggerheartSpec from '../../daggerheart.randsum.json'
import rootSpec from '../../root-rpg.randsum.json'

/**
 * Dual-consumer drift guard.
 *
 * Every game spec is interpreted twice: once by the CODE-GENERATED roll function
 * (`src/<game>.generated.ts`, which calls @randsum/roller directly) and once by the
 * RUNTIME pipeline (`loadSpec` -> executePipeline). The two implementations duplicate the
 * same classification logic (totals/pool-conditions -> outcomes, details), so they can
 * silently drift. This test feeds both the *same dice* (by seeding Math.random identically,
 * which both paths fall back to) and asserts they produce identical results.
 *
 * salvageunion is intentionally excluded: its remote-table lookup is baked into the
 * generated code at build time and is not available to the runtime pipeline.
 */

// mulberry32 — small deterministic PRNG so both consumers see identical dice.
function mulberry32(seed: number): () => number {
  const state = { a: seed >>> 0 }
  return () => {
    state.a = (state.a + 0x6d2b79f5) >>> 0
    const t0 = state.a
    const t1 = Math.imul(t0 ^ (t0 >>> 15), t0 | 1)
    const t2 = t1 ^ (t1 + Math.imul(t1 ^ (t1 >>> 7), t1 | 61))
    return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296
  }
}

type AnyResult = GameRollResult<
  string | number,
  Readonly<Record<string, unknown>> | undefined,
  unknown
>
type RollFn = (input?: RollInput) => AnyResult

function withSeed(seed: number, fn: RollFn, input: RollInput): AnyResult {
  const original = Math.random
  Math.random = mulberry32(seed)
  try {
    return fn(input)
  } finally {
    Math.random = original
  }
}

function diceOf(result: AnyResult): readonly number[] {
  return (result.rolls as readonly { readonly rolls: readonly number[] }[]).flatMap(r => r.rolls)
}

interface GameCase {
  readonly name: string
  readonly generated: RollFn
  readonly spec: RandSumSpec
  readonly inputs: readonly RollInput[]
}

const CASES: readonly GameCase[] = [
  {
    name: 'blades',
    generated: bladesGen.roll,
    spec: bladesSpec as RandSumSpec,
    inputs: [{}, { rating: 0 }, { rating: 1 }, { rating: 3 }, { rating: 6 }]
  },
  {
    name: 'pbta',
    generated: pbtaGen.roll as RollFn,
    spec: pbtaSpec as RandSumSpec,
    inputs: [{ stat: -1 }, { stat: 2, forward: 1 }, { stat: 5, rollingWith: 'Advantage' }]
  },
  {
    name: 'fifth',
    generated: fifthGen.roll,
    spec: fifthSpec as RandSumSpec,
    inputs: [
      { modifier: 0 },
      { modifier: 5, crit: true },
      { modifier: 3, rollingWith: 'Advantage' }
    ]
  },
  {
    name: 'daggerheart',
    generated: daggerheartGen.roll,
    spec: daggerheartSpec as RandSumSpec,
    inputs: [
      { modifier: 0 },
      { modifier: 2, amplifyHope: true },
      { modifier: 1, rollingWith: 'Disadvantage' }
    ]
  },
  {
    name: 'root-rpg',
    generated: rootGen.roll as RollFn,
    spec: rootSpec as RandSumSpec,
    inputs: [{ bonus: -1 }, { bonus: 2 }, { bonus: 4, rollingWith: 'Advantage' }]
  }
]

describe('generated vs runtime consumers agree (no drift)', () => {
  for (const gameCase of CASES) {
    const runtime = loadSpec(gameCase.spec)
    const runtimeRoll = runtime.roll as RollFn

    test(`${gameCase.name}: identical results for the same dice`, () => {
      const seeds = Array.from({ length: 40 }, (_, i) => i + 1)
      for (const input of gameCase.inputs) {
        for (const seed of seeds) {
          const generated = withSeed(seed, gameCase.generated, input)
          const interpreted = withSeed(seed, runtimeRoll, input)

          const label = `${gameCase.name} input=${JSON.stringify(input)} seed=${seed}`
          expect(diceOf(interpreted), `dice mismatch: ${label}`).toEqual(diceOf(generated))
          expect(interpreted.total, `total mismatch: ${label}`).toBe(generated.total)
          expect(interpreted.result, `result mismatch: ${label}`).toEqual(generated.result)
          expect(interpreted.details, `details mismatch: ${label}`).toEqual(generated.details)
        }
      }
    })
  }
})
