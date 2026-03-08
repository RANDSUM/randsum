import type { NotationSchema } from '../schema'
import { createArithmeticNotation } from './arithmetic'
import { registerNotationSchema } from '../registry'

export const plusSchema: NotationSchema<number> = createArithmeticNotation({
  name: 'plus',
  priority: 90,
  operator: '+',
  verb: 'Add'
})

registerNotationSchema(plusSchema)
