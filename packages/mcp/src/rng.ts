import type { RandomFn } from '@randsum/roller'

/**
 * Creates a deterministic random number generator from a seed.
 *
 * Uses a linear congruential generator (LCG) so the same seed always produces
 * the same sequence — useful for reproducible rolls from an agent.
 *
 * NOTE: `@randsum/roller` ships a `createSeededRandom` in its `test-utils`
 * package but does not yet export a seeded RNG factory from its public API
 * (the `createSeededRandom` referenced in roller's `roll()` docblock is
 * internal). Until roller exports one, this mirrors the CLI's local LCG
 * (see `apps/cli/src/run.ts`); swap this for the roller export once it lands.
 *
 * @param seed - Initial seed value (any integer)
 * @returns A function returning pseudo-random numbers in [0, 1)
 */
export function createSeededRandom(seed: number): RandomFn {
  const a = 1664525
  const c = 1013904223
  const m = 2 ** 32
  const state = { value: seed }
  return (): number => {
    // Normalize the modulo: JS `%` preserves the sign of the dividend, so a
    // negative seed could otherwise drive `value` negative and yield a random
    // number in (-1, 0), producing impossible dice faces. `((x % m) + m) % m`
    // keeps `value` in [0, m) for any integer seed.
    state.value = (((a * state.value + c) % m) + m) % m
    return state.value / m
  }
}
