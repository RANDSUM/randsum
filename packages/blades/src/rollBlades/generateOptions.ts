import type { RollOptions } from '@randsum/roller'

export function generateOptions(count: number): RollOptions<number> {
  if (!Number.isInteger(count)) {
    throw new Error(`Blades dice pool must be an integer, received: ${count}`)
  }

  if (count < 0) {
    throw new Error(`Blades dice pool must be non-negative, received: ${count}`)
  }

  if (count > 10) {
    throw new Error(
      `Blades dice pool is unusually large (${count}). Maximum recommended is 10.`
    )
  }

  const canCrit = count > 0
  if (canCrit) {
    return { sides: 6, quantity: count }
  }
  return { sides: 6, quantity: 2, modifiers: { drop: { highest: 1 } } }
}
