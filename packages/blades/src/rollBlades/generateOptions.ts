import type { RollOptions } from '@randsum/roller'

export function generateOptions(count: number, canCrit: boolean): RollOptions {
  if (canCrit) {
    return { sides: 6, quantity: count }
  }
  return { sides: 6, quantity: 2, modifiers: { drop: { highest: 1 } } }
}
