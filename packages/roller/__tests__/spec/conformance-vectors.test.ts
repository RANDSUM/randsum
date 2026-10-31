import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import { createQueueRandom } from '../../test-utils/src/queueRandom'
import { CONFORMANCE_FILE } from '../../spec/vectors'
import type { DiceNotation } from '../../src/notation/types'

/**
 * Conformance Vector Test Suite
 *
 * Runs the conformance vectors from the RANDSUM Dice Notation spec against roll().
 * Each non-error, non-indeterminate vector uses createQueueRandom to produce
 * deterministic results that should match expectedPool and expectedTotal.
 *
 * Skipped vectors and reasons:
 * - Draw die (DDN): Fisher-Yates shuffle in drawWithoutReplacement cannot be seeded
 *   via createQueueRandom's linear (v-1)/sides mapping.
 * - Custom string faces (d{fire,ice,lightning}): expectedPool contains strings;
 *   createQueueRandom only handles numeric faces.
 * - Null expectedPool/expectedTotal: indeterminate result per spec.
 *
 * Explode Sequence vectors list each sequence roll as the value on its own die
 * (a d4, then a d6, ...), so those are mapped through the sequence's sizes.
 */

/**
 * Convert a numeric face value to the 1-based index used by createQueueRandom
 * for numericFaces-based dice (Fate, zero-bias).
 *
 * The roller maps rng() via: numericFaces[Math.floor(rng() * numericFaces.length)]
 * createQueueRandom maps value v via: rng() = (v - 1) / sides
 * So to hit index i: pass (i + 1) and use sides = numericFaces.length
 */
function faceValueToQueueIndex(faceValue: number, faces: readonly number[]): number {
  const idx = faces.indexOf(faceValue)
  if (idx === -1) throw new Error(`Face value ${faceValue} not found in faces [${faces.join(',')}]`)
  return idx + 1
}

// Face arrays for special dice
const FATE_FACES = [-1, 0, 1] as const
const FATE_2_FACES = [-2, -1, 0, 1, 2] as const

// Known conformance gaps: vector ids that cannot pass due to roller behavior mismatches
// These are marked .todo() rather than skipped to surface them as known failures.
const KNOWN_CONFORMANCE_GAPS: Record<number, string> = {}

describe('Conformance Vectors', () => {
  for (const vector of CONFORMANCE_FILE.vectors) {
    const name = `Vector ${vector.id}: ${vector.notation}`

    // Known conformance gaps — mark as todo with explanation
    if (KNOWN_CONFORMANCE_GAPS[vector.id] !== undefined) {
      test.todo(`${name} — CONFORMANCE GAP: ${KNOWN_CONFORMANCE_GAPS[vector.id] ?? ''}`, () => {
        // placeholder for todo test — implementation gap tracked above
      })
      continue
    }

    // Error vectors — assert roll() throws
    if ('expectedError' in vector && vector.expectedError) {
      test(name, () => {
        expect(() => roll(vector.notation as DiceNotation)).toThrow()
      })
      continue
    }

    // Indeterminate vectors — skip with explanation
    if (
      !('expectedPool' in vector) ||
      vector.expectedPool === null ||
      vector.expectedTotal === null
    ) {
      test.skip(`${name} (indeterminate — expectedPool/expectedTotal is null; see spec note)`, () => {
        // No assertion possible without a deterministic expected value
      })
      continue
    }

    // Custom faces dice (non-numeric pool values like strings) — skip
    // Vector 31: d{fire,ice,lightning} — expectedPool contains strings
    if (
      Array.isArray(vector.expectedPool) &&
      vector.expectedPool.some((v: unknown) => typeof v !== 'number')
    ) {
      test.skip(`${name} (custom string faces — createQueueRandom only handles numeric faces)`, () => {
        // Non-numeric custom face values cannot be deterministically seeded
      })
      continue
    }

    // Draw die — skip: Fisher-Yates shuffle in drawWithoutReplacement cannot be seeded
    // via createQueueRandom's simple (v-1)/sides mapping
    if (/^\d*DD\d+/i.test(vector.notation)) {
      test.skip(`${name} (draw die — Fisher-Yates shuffle incompatible with createQueueRandom)`, () => {
        // drawWithoutReplacement uses Fisher-Yates which consumes rng() differently
      })
      continue
    }

    test(name, () => {
      const notation = vector.notation as DiceNotation
      const expectedPool = vector.expectedPool as number[]
      const expectedTotal = vector.expectedTotal!

      // Determine die sides and build the queue
      const { sides, queueRolls } = ((): { sides: number; queueRolls: number[] } => {
        if (/^(\d+)?dF\.2/i.test(notation)) {
          // dF.2 — extended Fudge die, faces [-2,-1,0,1,2]
          return {
            sides: FATE_2_FACES.length,
            queueRolls: (vector.seedRolls as number[]).map(v =>
              faceValueToQueueIndex(v, FATE_2_FACES)
            )
          }
        }
        if (/^(\d+)?dF(\.1)?(?!\.)/i.test(notation)) {
          // dF — Fate Core die, faces [-1,0,1]
          return {
            sides: FATE_FACES.length,
            queueRolls: (vector.seedRolls as number[]).map(v =>
              faceValueToQueueIndex(v, FATE_FACES)
            )
          }
        }
        if (/^(\d+)?z(\d+)/i.test(notation)) {
          // zN — zero-bias die, faces [0..N-1]
          const match = /^(?:\d+)?z(\d+)/i.exec(notation)
          const n = parseInt(match![1]!, 10)
          const zbFaces = Array.from({ length: n }, (_: unknown, i: number) => i)
          return {
            sides: zbFaces.length,
            queueRolls: (vector.seedRolls as number[]).map(v => faceValueToQueueIndex(v, zbFaces))
          }
        }
        if (/^d%/i.test(notation)) {
          // d% — percentile die, 1d100
          return { sides: 100, queueRolls: vector.seedRolls as number[] }
        }
        if (/^(\d+)?g(\d+)/i.test(notation)) {
          // gN — geometric die: rolls standard NdS until non-max, uses sides from notation
          const match = /^(?:\d+)?g(\d+)/i.exec(notation)
          if (!match) throw new Error(`Cannot extract sides from geometric notation: ${notation}`)
          return { sides: parseInt(match[1]!, 10), queueRolls: vector.seedRolls as number[] }
        }
        // Standard NdS — extract sides from notation (handles modifiers after dN)
        const match = /^(?:\d+)?[dD](\d+)/i.exec(notation)
        if (!match) throw new Error(`Cannot extract sides from notation: ${notation}`)
        return { sides: parseInt(match[1]!, 10), queueRolls: vector.seedRolls as number[] }
      })()

      const rerollRolls = 'rerollRolls' in vector ? (vector.rerollRolls as number[]) : undefined
      const explodeRolls = 'explodeRolls' in vector ? (vector.explodeRolls as number[]) : undefined
      const compoundRolls =
        'compoundRolls' in vector ? (vector.compoundRolls as number[]) : undefined
      const penetrateRolls =
        'penetrateRolls' in vector ? (vector.penetrateRolls as number[]) : undefined
      const sequenceRolls =
        'sequenceRolls' in vector ? (vector.sequenceRolls as number[]) : undefined

      // createQueueRandom maps every value through one die size; a sequence die
      // has its own, so its rolls are appended at their own sizes.
      const sequenceSizes = /!s\{([\d,]+)\}/i.exec(notation)?.[1]?.split(',').map(Number) ?? []
      const baseRandom = createQueueRandom({
        sides,
        rolls: queueRolls,
        ...(rerollRolls !== undefined ? { rerollRolls } : {}),
        ...(explodeRolls !== undefined ? { explodeRolls } : {}),
        ...(compoundRolls !== undefined ? { compoundRolls } : {}),
        ...(penetrateRolls !== undefined ? { penetrateRolls } : {})
      })
      const sequenceQueue = (sequenceRolls ?? []).map(
        (v, i) => (v - 1) / (sequenceSizes[i] ?? sequenceSizes.at(-1) ?? sides)
      )
      const baseCalls =
        queueRolls.length +
        (rerollRolls?.length ?? 0) +
        (explodeRolls?.length ?? 0) +
        (compoundRolls?.length ?? 0) +
        (penetrateRolls?.length ?? 0)
      const calls = { n: 0 }
      const queueRandom = (): number => {
        calls.n += 1
        return calls.n > baseCalls ? (sequenceQueue[calls.n - baseCalls - 1] ?? 0) : baseRandom()
      }

      const result = roll(notation, { randomFn: queueRandom })
      const record = result.rolls[0]!

      expect(record.rolls).toEqual(expectedPool)
      expect(result.total).toBe(expectedTotal)
    })
  }
})

// Spec §11.4: a level may be claimed only when every vector at that level passes.
// While any Level 4 vector is a known gap, no published page may claim Level 4.
describe('published conformance claims', () => {
  const repoRoot = new URL('../../../../', import.meta.url).pathname
  const claimSources = [
    'README.md',
    'llms.txt',
    'apps/*/README.md',
    'packages/*/README.md',
    'apps/site/src/content/docs/**/*.mdx'
  ]
  const level4Gaps = CONFORMANCE_FILE.conformanceLevels.level4_full.filter(
    id => KNOWN_CONFORMANCE_GAPS[id] !== undefined
  )

  test.skipIf(level4Gaps.length === 0)('no page claims Level 4 (Full) conformance', async () => {
    const offenders: string[] = []
    for (const pattern of claimSources) {
      for await (const file of new Bun.Glob(pattern).scan(repoRoot)) {
        const text = await Bun.file(`${repoRoot}${file}`).text()
        if (/Level 4 \(Full\) conforman/i.test(text)) offenders.push(file)
      }
    }
    expect(offenders).toEqual([])
  })
})

// Vectors 31, 33 and 51 depend on how an implementation maps random numbers to
// faces and shuffles (spec §11.3), so the queue above cannot replay them. Check
// what they promise regardless of the shuffle: the pool's size and its values.
describe('vectors that depend on the shuffle', () => {
  test('Vector 31: 2d{fire,ice,lightning} rolls two of its faces', () => {
    const record = roll('2d{fire,ice,lightning}').rolls[0]!
    expect(record.customResults).toHaveLength(2)
    for (const face of record.customResults ?? []) {
      expect(['fire', 'ice', 'lightning']).toContain(face)
    }
  })

  test.each([
    ['3DD6', 3, 3],
    ['3DD6L', 3, 2]
  ])('%s draws %i distinct values from 1..6 and keeps %i', (notation, drawn, kept) => {
    for (const _ of Array.from({ length: 200 })) {
      const record = roll(notation as DiceNotation).rolls[0]!
      expect(record.rolls).toHaveLength(kept)
      expect(new Set(record.initialRolls).size).toBe(drawn)
      for (const value of record.initialRolls) expect(value >= 1 && value <= 6).toBe(true)
    }
  })
})
