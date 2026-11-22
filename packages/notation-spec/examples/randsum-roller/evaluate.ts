// The reference adapter's logic: answer one RDN conformance request with
// @randsum/roller, replaying the request's die values through createQueueRandom.
// adapter.ts wraps it in the stdio protocol; the package's tests call it directly.
import { type DiceNotation, roll } from '@randsum/roller'
import { createQueueRandom } from '@randsum/roller/random'
import type { AdapterResponse, VectorRequest } from '../../src/runner'

// createQueueRandom turns die value v on an S-sided die into (v - 1) / S. Dice with
// their own faces (Fate, zero-bias) pick faces[floor(rng * faces.length)], so a
// face value replays as its 1-based index into those faces.
const FATE = [-1, 0, 1]
const FATE_2 = [-2, -1, 0, 1, 2]

function faceIndices(values: readonly number[], faces: readonly number[]): number[] {
  return values.map(value => {
    const i = faces.indexOf(value)
    if (i === -1) throw new Error(`${value} is not one of the faces ${faces.join(',')}`)
    return i + 1
  })
}

// Inflation and Reduction walk the standard die set (spec Sections 6.7.9, 6.7.10).
const STANDARD_SIZES = [4, 6, 8, 10, 12, 20, 100]

/** The die sizes an explode sequence rolls, in order, for a pool of `sides`-sided dice. */
function sequenceSizes(notation: string, sides: number): number[] {
  const listed = /!s\{([\d,]+)\}/i.exec(notation)?.[1]
  if (listed !== undefined) return listed.split(',').map(Number)
  if (/!i/i.test(notation)) return STANDARD_SIZES.filter(size => size > sides)
  if (/!r(?!o?\{)/i.test(notation)) return STANDARD_SIZES.filter(size => size < sides).reverse()
  return []
}

/**
 * Several standard pools (`2d6+1d8`) each have their own die size, so the seed
 * values are scaled pool by pool, in notation order.
 */
function poolFractions(notation: string, seedRolls: readonly number[]): number[] | undefined {
  const pools = [...notation.matchAll(/(?:^|[+-])(\d*)d(\d+)/gi)]
  if (pools.length < 2) return undefined
  const sizes = pools.flatMap(([, quantity = '', sides = '']) =>
    Array.from({ length: Number(quantity || 1) }, () => Number(sides))
  )
  return seedRolls.map((value, i) => (value - 1) / (sizes[i] ?? 1))
}

function queueFor(
  notation: string,
  seedRolls: readonly number[]
): { sides: number; rolls: number[] } {
  if (/^\d*dF\.2/i.test(notation)) return { sides: 5, rolls: faceIndices(seedRolls, FATE_2) }
  if (/^\d*dF(\.1)?(?!\.)/i.test(notation)) return { sides: 3, rolls: faceIndices(seedRolls, FATE) }
  const zero = /^\d*z(\d+)/i.exec(notation)
  if (zero?.[1] !== undefined) {
    const n = Number(zero[1])
    return {
      sides: n,
      rolls: faceIndices(
        seedRolls,
        Array.from({ length: n }, (_, i) => i)
      )
    }
  }
  if (/^d%/i.test(notation)) return { sides: 100, rolls: [...seedRolls] }
  const sides = /^\d*[dg](\d+)/i.exec(notation)?.[1]
  if (sides === undefined) throw new Error(`Cannot find the die size in ${notation}`)
  return { sides: Number(sides), rolls: [...seedRolls] }
}

function replayed(request: VectorRequest): () => number {
  const notation = request.notation.trim()
  const fractions = poolFractions(notation, request.seedRolls ?? [])
  if (fractions !== undefined) {
    const next = { i: 0 }
    return () => fractions[next.i++] ?? 0
  }
  const { sides, rolls } = queueFor(notation, request.seedRolls ?? [])
  const base = createQueueRandom({
    sides,
    rolls,
    ...(request.rerollRolls === undefined ? {} : { rerollRolls: request.rerollRolls }),
    ...(request.explodeRolls === undefined ? {} : { explodeRolls: request.explodeRolls }),
    ...(request.compoundRolls === undefined ? {} : { compoundRolls: request.compoundRolls }),
    ...(request.penetrateRolls === undefined ? {} : { penetrateRolls: request.penetrateRolls })
  })
  // A sequence die has its own size, so its values are mapped through the sizes
  // the sequence rolls rather than the pool's die.
  const sizes = sequenceSizes(notation, sides)
  const sequence = (request.sequenceRolls ?? []).map(
    (v, i) => (v - 1) / (sizes[i] ?? sizes.at(-1) ?? sides)
  )
  const baseCalls =
    rolls.length +
    (request.rerollRolls?.length ?? 0) +
    (request.explodeRolls?.length ?? 0) +
    (request.compoundRolls?.length ?? 0) +
    (request.penetrateRolls?.length ?? 0)
  const calls = { n: 0 }
  return () => {
    calls.n += 1
    return calls.n > baseCalls ? (sequence[calls.n - baseCalls - 1] ?? 0) : base()
  }
}

/** How many evaluations the notation's trailing repeats ask for (`4d6x2x3` is six). */
function repeatCount(notation: string): number {
  const repeats = /(?:x\d+)+$/i.exec(notation)?.[0] ?? ''
  return [...repeats.matchAll(/x(\d+)/gi)].reduce((n, [, count = '1']) => n * Number(count), 1)
}

export function evaluate(request: VectorRequest): AdapterResponse {
  const { id } = request
  const notation = request.notation.trim()
  // Custom faces and draw dice pick and shuffle in their own way, which the
  // queue cannot replay (spec Section 11.3): roll them at random and say so.
  const unseeded = /^\d*d\{/i.test(notation) || /^\d*DD\d+/i.test(notation)
  try {
    const result = unseeded
      ? roll(request.notation as DiceNotation)
      : roll(request.notation as DiceNotation, { randomFn: replayed(request) })
    const record = result.rolls[0]
    if (record === undefined) return { id, error: 'roll() returned no pool' }
    const custom = record.customResults
    if (custom !== undefined) return { id, pool: custom, total: null, seeded: false }
    // A repeated notation answers with each evaluation's pool and total
    const repeats = repeatCount(notation)
    if (repeats > 1) {
      const perEvaluation = result.rolls.length / repeats
      const results = Array.from({ length: repeats }, (_, i) => {
        const records = result.rolls.slice(i * perEvaluation, (i + 1) * perEvaluation)
        return {
          pool: records.flatMap(pooled => pooled.rolls),
          total: records.reduce((sum, pooled) => sum + pooled.appliedTotal, 0)
        }
      })
      return { id, results }
    }
    // Several pools answer as one: their dice one after another, in notation order
    const pool = result.rolls.flatMap(pooled => pooled.rolls)
    return { id, pool, total: result.total, ...(unseeded ? { seeded: false } : {}) }
  } catch (error) {
    return { id, error: error instanceof Error ? error.message : String(error) }
  }
}
