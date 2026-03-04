/**
 * Increments dice quantity for a given side count in the current notation input.
 *
 * - Empty input -> "1d{sides}"
 * - Input contains same type -> increment quantity
 * - Otherwise -> append with "+"
 */
export function incrementDiceQuantity(currentInput: string, sides: number): string {
  const trimmed = currentInput.trim()

  if (trimmed === '') {
    return `1d${sides}`
  }

  // Match pattern like "NdS" where S matches our sides
  const pattern = new RegExp(`(\\d+)d${sides}(?![\\d])`)
  const match = trimmed.match(pattern)

  if (match) {
    const currentQuantity = parseInt(match[1], 10)
    return trimmed.replace(pattern, `${currentQuantity + 1}d${sides}`)
  }

  return `${trimmed}+1d${sides}`
}
