export function coreRandom(max: number): number {
  return (Math.random() * max) | 0
}

export function createSeededRandom(
  seed: number = Date.now()
): (max: number) => number {
  let currentSeed = seed

  return function seededRandom(max: number): number {
    currentSeed ^= currentSeed << 13
    currentSeed ^= currentSeed >> 17
    currentSeed ^= currentSeed << 5

    const randomValue = Math.abs(currentSeed) / 2147483647
    return (randomValue * max) | 0
  }
}
