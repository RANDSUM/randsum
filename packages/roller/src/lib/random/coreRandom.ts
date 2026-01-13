export type RandomFn = () => number

export function coreRandom(max: number, rng: RandomFn = Math.random): number {
  return (rng() * max) | 0
}
