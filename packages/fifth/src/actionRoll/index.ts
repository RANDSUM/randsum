import { type RollerRollResult, roll } from '@randsum/roller'
import type { FifthRollArgument } from '../types'
import { generateQuantity } from './generateQuantity'
import { generateModifiers } from './generateModifiers'

export function actionRoll(arg: FifthRollArgument): RollerRollResult {
  return roll({
    sides: 20,
    quantity: generateQuantity(arg.rollingWith),
    modifiers: { ...generateModifiers(arg.rollingWith), plus: arg.modifier }
  })
}
