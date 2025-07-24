import type { RequiredNumericRollParameters } from '../../../types'

export function applyExploding(
  rolls: number[],
  { sides }: RequiredNumericRollParameters,
  rollOne: () => number
): number[] {
  let explodeCount = 0

  for (const roll of rolls) {
    if (roll === sides) {
      explodeCount++
    }
  }

  if (explodeCount === 0) {
    return rolls
  }

  const explodedRolls = [...rolls]
  for (let i = 0; i < explodeCount; i++) {
    explodedRolls.push(rollOne())
  }

  return explodedRolls
}
