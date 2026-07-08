import type { RandomFn } from './lib/random'

export type { RandomFn } from './lib/random'

/**
 * Creates a deterministic random number generator from a seed.
 *
 * Uses a linear congruential generator (LCG) so the same seed always produces
 * the same sequence of numbers in `[0, 1)` — useful for reproducible rolls,
 * seeded tests, and replayable sessions.
 *
 * The modulo is normalized so any integer seed (including negative seeds) yields
 * a value in `[0, 1)`. JavaScript's `%` keeps the dividend's sign, so a negative
 * seed could otherwise drive the state negative and produce impossible dice
 * faces; `((x % m) + m) % m` keeps the state in `[0, m)`.
 *
 * @param seed - Initial seed value (any integer)
 * @returns A `RandomFn` returning pseudo-random numbers in `[0, 1)`
 *
 * @example
 * ```ts
 * import { roll } from '@randsum/roller/roll'
 * import { createSeededRandom } from '@randsum/roller/random'
 *
 * const seeded = createSeededRandom(42)
 * const result = roll('1d20', { randomFn: seeded })
 * ```
 */
export function createSeededRandom(seed: number): RandomFn {
  const state = { seed }
  const m = 2 ** 32

  return (): number => {
    // LCG parameters (same constants used by many standard libraries).
    state.seed = (((state.seed * 1664525 + 1013904223) % m) + m) % m
    return state.seed / m
  }
}

/**
 * Options describing a pre-determined sequence of die values for
 * {@link createQueueRandom}.
 */
export interface QueueRandomOptions {
  readonly sides: number
  readonly rolls: readonly number[]
  readonly rerollRolls?: readonly number[]
  readonly explodeRolls?: readonly number[]
  readonly compoundRolls?: readonly number[]
  readonly penetrateRolls?: readonly number[]
  readonly sequenceRolls?: readonly number[]
}

/**
 * Creates a deterministic random function from pre-determined die values.
 *
 * Accepts literal die values (e.g. `[3, 5, 2]`) and returns a `RandomFn` that
 * maps each value back to the correct `[0, 1)` range for use with `roll()`.
 * Ideal for replaying an exact sequence of rolls.
 *
 * The roller converts `randomFn()` to a die value via
 * `Math.floor(rng() * sides) + 1`, so to produce die value `v` on a die with
 * `sides` sides, `rng()` must return `(v - 1) / sides`.
 *
 * Roll arrays are consumed in modifier priority order:
 *   rolls → rerollRolls → explodeRolls → compoundRolls → penetrateRolls → sequenceRolls
 *
 * @throws Error if the queue is exhausted before all calls are satisfied
 */
export function createQueueRandom(options: QueueRandomOptions): RandomFn {
  const { sides, rolls, rerollRolls, explodeRolls, compoundRolls, penetrateRolls, sequenceRolls } =
    options

  const queue = [
    ...rolls,
    ...(rerollRolls ?? []),
    ...(explodeRolls ?? []),
    ...(compoundRolls ?? []),
    ...(penetrateRolls ?? []),
    ...(sequenceRolls ?? [])
  ]

  const state = { index: 0 }

  return (): number => {
    const value = queue[state.index]
    if (value === undefined) {
      throw new Error(
        `createQueueRandom: queue exhausted after ${queue.length} call(s). Provide more rolls.`
      )
    }
    state.index += 1
    return (value - 1) / sides
  }
}
