export function createFrequencyMap(values: number[]): Map<number, number> {
  const freq = new Map<number, number>()

  for (const value of values) {
    freq.set(value, (freq.get(value) ?? 0) + 1)
  }

  return freq
}
