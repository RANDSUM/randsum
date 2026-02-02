import type { RollRecord } from '@randsum/roller'

export function digestHopeFearTotal(roll: RollRecord): {
  roll: number
  amplified: boolean
} {
  return {
    roll: roll.total,
    amplified: roll.parameters.sides === 20
  }
}
