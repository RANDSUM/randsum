import { roll } from '@randsum/roller'

export function advantageDie(): number {
  return roll({
    quantity: 1,
    sides: 6
  }).total
}
