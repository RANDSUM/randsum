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

export function rollSingle(max: number): number {
  return coreRandom(max) + 1
}

export function rollMultiple(quantity: number, sides: number): number[] {
  if (quantity < 0) {
    throw new Error('Quantity cannot be negative')
  }

  if (sides < 1) {
    throw new Error('Dice must have at least 1 side')
  }

  return coreSpreadRolls(quantity, sides)
}

export function randomInRange(min: number, max: number): number {
  if (min > max) {
    throw new Error('Minimum value cannot be greater than maximum value')
  }

  return min + coreRandom(max - min + 1)
}

export function randomBoolean(trueProbability = 0.5): boolean {
  if (trueProbability < 0 || trueProbability > 1) {
    throw new Error('Probability must be between 0 and 1')
  }

  return Math.random() < trueProbability
}
