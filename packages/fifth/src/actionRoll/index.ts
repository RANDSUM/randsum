import { type RollerRollResult, rollWrapper } from '@randsum/roller'
import type { FifthRollArgument } from '../types'
import { generateQuantity } from './generateQuantity'
import { generateModifiers } from './generateModifiers'

const actionRoll: (arg: FifthRollArgument) => RollerRollResult = rollWrapper({
  toArg: (arg: FifthRollArgument) => [
    {
      sides: 20,
      quantity: generateQuantity(arg.rollingWith),
      modifiers: { ...generateModifiers(arg.rollingWith), plus: arg.modifier }
    }
  ]
})

export { actionRoll }
