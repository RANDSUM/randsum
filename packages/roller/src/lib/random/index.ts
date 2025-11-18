export function coreRandom(max: number): number {
  if (!Number.isFinite(max)) {
    return 0
  }

  if (max === 0) {
    return 0
  }

  const upper = Math.floor(Math.abs(max))
  if (upper <= 1) {
    return 0
  }

  return Math.floor(Math.random() * upper)
}

export function coreSpreadRolls(quantity: number, max: number): number[] {
  const rolls: number[] = []
  const upper = Math.floor(max)

  if (quantity <= 0) return rolls

  for (let i = 0; i < quantity; i++) {
    if (upper <= 0) {
      rolls.push(1)
    } else {
      // coreRandom returns [0, upper), but dice should be [1, upper]
      rolls.push(coreRandom(upper) + 1)
    }
  }

  return rolls
}


