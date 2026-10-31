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
  const { notation } = request
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
  // in !s{...} rather than the pool's die.
  const sizes = /!s\{([\d,]+)\}/i.exec(notation)?.[1]?.split(',').map(Number) ?? []
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

export function evaluate(request: VectorRequest): AdapterResponse {
  const { id, notation } = request
  // Custom faces and draw dice pick and shuffle in their own way, which the
  // queue cannot replay (spec Section 11.3): roll them at random and say so.
  const unseeded = /^\d*d\{/i.test(notation) || /^\d*DD\d+/i.test(notation)
  try {
    const result = unseeded
      ? roll(notation as DiceNotation)
      : roll(notation as DiceNotation, { randomFn: replayed(request) })
    const record = result.rolls[0]
    if (record === undefined) return { id, error: 'roll() returned no pool' }
    const custom = record.customResults
    return custom === undefined
      ? { id, pool: record.rolls, total: result.total, ...(unseeded ? { seeded: false } : {}) }
      : { id, pool: custom, total: null, seeded: false }
  } catch (error) {
    return { id, error: error instanceof Error ? error.message : String(error) }
  }
}
