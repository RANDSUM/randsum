import type { RollerRollResult } from '../../types'

export function calculateResultTotal(rolls: RollerRollResult['rolls']): number {
  return rolls.reduce((acc, cur) => {
    const factor = cur.parameters.arithmetic === 'subtract' ? -1 : 1
    const total = cur.total * factor
    return acc + total
  }, 0)
}
