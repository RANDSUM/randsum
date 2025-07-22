import type { RollResult } from '@randsum/roller'
import { rollWrapper } from '@randsum/roller'
import { interpretHit } from './interpretHit'
import type { BladesResult } from './types'

const rollBlades: (arg: number) => RollResult<BladesResult> = rollWrapper({
  validateInput: (count: number) => {
    if (!Number.isInteger(count)) {
      throw new Error(`Blades dice pool must be an integer, received: ${count}`)
    }

    if (count < 0) {
      throw new Error(
        `Blades dice pool must be non-negative, received: ${count}`
      )
    }

    if (count > 10) {
      throw new Error(
        `Blades dice pool is unusually large (${count}). Maximum recommended is 10.`
      )
    }
  },
  toArg: (count: number) => {
    const canCrit = count > 0
    return [
      {
        sides: 6,
        quantity: canCrit ? count : 2,
        ...(canCrit
          ? {}
          : {
              modifiers: { drop: { highest: 1 } }
            })
      }
    ]
  },
  toResult: (rollResult, count) => ({
    ...rollResult,
    result: interpretHit(rollResult, count > 0)
  })
})

export { rollBlades }
