import type { RandomFn } from '../../src/lib/random'

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
 * Accepts literal die values (e.g., [3, 5, 2]) and returns a `RandomFn`
 * that maps each value to the correct [0,1) range for use with roll().
 *
 * The roller converts randomFn() to a die value via:
 *   Math.floor(rng() * sides) + 1
 *
 * So to produce die value `v` on a die with `sides` sides:
 *   rng() must return (v - 1) / sides
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
    if (state.index >= queue.length) {
      throw new Error(
        `createQueueRandom: queue exhausted after ${queue.length} call(s). Provide more rolls.`
      )
    }
    const value = queue[state.index]!
    state.index += 1
    return (value - 1) / sides
  }
}
