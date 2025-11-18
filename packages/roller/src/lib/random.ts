export function coreRandom(max: number): number {
  if (max <= 0) {
    return 0
  }
  return Math.floor(Math.random() * max)
}

export function coreSpreadRolls(quantity: number, max: number): number[] {
  if (quantity <= 0) {
    return []
  }

  const results: number[] = []
  for (let i = 0; i < quantity; i++) {
    const roll = coreRandom(max) + 1
    results.push(roll)
  }
  return results
}

