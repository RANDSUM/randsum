import { rollWrapper } from '@randsum/roller'
import { interpretHit } from './interpretHit'
import type { BladesRollResult } from '../types'
import { generateOptions } from './generateOptions'

const rollBlades: (arg: number) => BladesRollResult = rollWrapper(
  generateOptions,
  (rollResult): BladesRollResult => ({
    ...rollResult,
    result: interpretHit(rollResult)
  })
)

export { rollBlades }
