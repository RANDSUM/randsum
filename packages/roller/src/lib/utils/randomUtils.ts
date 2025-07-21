export function coreRandom(max: number): number {
  return (Math.random() * max) | 0
}

export function coreSpreadRolls(quantity: number, max: number): number[] {
  if (quantity <= 0) return []

  const result = new Array<number>(quantity)

  for (let i = 0; i < quantity; i++) {
    result[i] = coreRandom(max) + 1
  }

  return result
}
